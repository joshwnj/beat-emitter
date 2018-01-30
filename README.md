# beat-emitter

_WebAudio scheduler with an event emitter_

## Features

- runs as a web worker (so that `setInterval` fires more reliably)
- schedules audio events with a slight look-ahead, for precise timing

## Usage

```
const beatEmitter = require('beat-emitter')

const ac = new AudioContext()
const beats = beatEmitter(ac)

beats.setBpm(110)
beats.start()
beats.schedule((beat, time) => {
  // play a note every 2nd beat
  if (beat % 2 === 0) {
    const osc = ac.createOscillator()
    osc.frequency.value = 440
    osc.start(time)
    osc.stop(time + 0.1)
    osc.connect(ac.destination)
  }
})
```

## Acknowledgements

I learned a lot from reading https://github.com/cwilso/metronome and based the code on this.
