let reverb = new Tone.JCReverb().toMaster()
// let chorus = new Tone.Chorus().connect(reverb)
let distortion = new Tone.Distortion(0.4).connect(reverb)

let topscore = `
    Db6 Db6 Db6

C6  F5  Ab5 C6
G5  F5  Ab5 C6

Bb5 E5  G5  Db5
C5  E5  G5  Bb5

Ab5 C5  F5  Ab5
C6  F5  Db6 C6

Bb5 G5  E5  Db5
C5  E5  G5  Bb5

A5  C#5 E5  A5
C#6 A5  E5  C#6

C6  D5  F#5 A5
C6  A5  F#5 C6

B5  D5  F5  G5
B5  G5  F5  B5

Bb5 C5  E5  G5
Db5 E5  G5  Db6

C6  Ab5 G5  F5
Db5 C5  Ab5 G5
F5  Db5 C5  Ab5 F5`.trim().split(/\s+/)

let bassscore = `
Ab3 G3 F3 E3 C#3 D3 F3 E3`.trim().split(/\s+/)

var synth = new Tone.Synth().connect(distortion)
synth.volume.value = -30
var basser = new Tone.FMSynth().connect(distortion)
basser.volume.value = -20
let topline = new Tone.Sequence((time, note) => {synth.triggerAttackRelease(Tone.Frequency(note).transpose(0), '16n', time)}, topscore, '16n')
let bassline = new Tone.Sequence((time, note) => {basser.triggerAttackRelease(Tone.Frequency(note).transpose(0), '4n', time)}, bassscore, '2n')
topline.start('0:3:1')
bassline.start('1m')
Tone.Transport.bpm.value = 120
Tone.Transport.start()
