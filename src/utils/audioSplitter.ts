export async function splitAudioFile(file: File, maxDurationSec: number = 600): Promise<File[]> {
  // 1. Read the file into an ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  
  // 2. Decode the audio data
  // We use standard AudioContext for decoding
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  const chunks: File[] = [];
  const duration = audioBuffer.duration;
  
  // If the file is shorter than maxDurationSec, return as is (but maybe encode to WAV anyway to be consistent, or just return original file? returning original file is safer to preserve format and quality)
  // Wait, if it's > 25MB but duration is short, we might still want to encode it to 16kHz WAV.
  // Actually, we should only split if duration > maxDurationSec or size > 20MB.
  // The user specifically asked to handle files > 20MB by splitting into 10m parts.
  
  const targetSampleRate = 16000;
  
  for (let start = 0; start < duration; start += maxDurationSec) {
    let end = start + maxDurationSec;
    if (end > duration) end = duration;
    
    const chunkDuration = end - start;
    
    // We use OfflineAudioContext to resample to 16kHz mono
    const offlineCtx = new OfflineAudioContext(1, chunkDuration * targetSampleRate, targetSampleRate);
    
    // Create buffer source
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    
    // Connect to destination
    source.connect(offlineCtx.destination);
    
    // Start playback at the correct offset
    // start() parameters: when, offset, duration
    source.start(0, start, chunkDuration);
    
    // Render the chunk
    const renderedBuffer = await offlineCtx.startRendering();
    
    // Convert to WAV
    const wavBlob = audioBufferToWav(renderedBuffer);
    
    // Create a new File object
    const partNum = Math.floor(start / maxDurationSec) + 1;
    const originalName = file.name.replace(/\.[^/.]+$/, "");
    const chunkFile = new File([wavBlob], `${originalName} - Part ${partNum}.wav`, { type: 'audio/wav' });
    chunks.push(chunkFile);
  }
  
  return chunks;
}

// Simple WAV encoder for AudioBuffer (Mono, 16-bit)
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const result = new Float32Array(buffer.length * numChannels);
  
  // Interleave channels if necessary (we requested mono, so it's just 1 channel)
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < channelData.length; i++) {
      result[i * numChannels + channel] = channelData[i];
    }
  }
  
  const dataLength = result.length * (bitDepth / 8);
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);
  
  // RIFF identifier 'RIFF'
  writeString(view, 0, 'RIFF');
  // file length
  view.setUint32(4, 36 + dataLength, true);
  // RIFF type 'WAVE'
  writeString(view, 8, 'WAVE');
  // format chunk identifier 'fmt '
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, format, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier 'data'
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataLength, true);
  
  // Write the PCM samples
  let offset = 44;
  for (let i = 0; i < result.length; i++) {
    let s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
