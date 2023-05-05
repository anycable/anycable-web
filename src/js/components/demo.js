import DemoController from './DemoController';

const scenario = [
  {
    type: 'message',
    delay: 500,
    from: 'any',
    text: 'I want to tell you something',
  },
  {
    type: 'message',
    delay: 1200,
    from: 'action',
    text: 'Go ahead',
  },
  {
    type: 'status',
    event: 'offline',
    from: 'action',
    delay: 1340,
  },
  {
    type: 'message',
    delay: 1200,
    from: 'any',
    text: 'I started my new project with Laravel',
  },
  {
    type: 'status',
    event: 'online',
    from: 'action',
    delay: 1840,
  },
  {
    type: 'message',
    delay: 1500,
    from: 'action',
    text: '???',
  },
  {
    type: 'message',
    delay: 1300,
    from: 'any',
    text: 'Why are you so mad?',
  },
  {
    type: 'status',
    event: 'offline',
    from: 'any',
    delay: 1240,
  },
  {
    type: 'message',
    from: 'action',
    delay: 1400,
    text: 'You promised to tell me something',
  },
  {
    type: 'message',
    from: 'action',
    delay: 1200,
    text: 'And then—silence',
  },
  {
    type: 'status',
    event: 'online',
    from: 'any',
    delay: 960,
  },
  {
    type: 'message',
    from: 'any',
    delay: 1500,
    text: 'Oh, I guess, you lost my message about Laravel :)',
  },
];

const demo = new DemoController({
  element: document.querySelector("[data-controller='demo']"),
  scenario,
});

demo.init();
