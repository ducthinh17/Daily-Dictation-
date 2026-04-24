const q = "食べる";
fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=vi&hl=vi&dt=bd&dt=md&dt=rm&dt=t&q=${encodeURIComponent(q)}`)
.then(r => r.json())
.then(d => console.log(JSON.stringify(d, null, 2)));
