# AnyCable everywhere: real-time visualization streaming for Poll Everywhere

June 9, 2023
{date}

Poll Everywhere, the leading platform for live audience engagement and direct feedback in a hybrid work environment, was seeking a matching solution for serving streaming updates. At the same time, they wished to migrate their real-time chart visualizations to [Hotwire][]. This choice had to be made carefully since the application couldn’t afford to force thousands of users to wait too long for a solution to process updates. This is the story of how they made that choice.
{intro}

<div class="divider"></div>

But first, some background: [Poll Everywhere][] is a Software-as-a-Service company that built an audience engagement tool for creating interactive live polls, surveys, Q&As, word clouds, and quizzes. It’s used in presentations, meetings, classrooms, and events of any size (for instance, our team at Evil Martians has used it during internal team-building exercises!)

<figure class="blog--figure blog--figure-rows">
  <img class="blog--media blog--media-half-n-half" title="Poll Everywhere UI example" src="/images/blog/poll-martian-products.png">
  <img class="blog--media blog--media-half-n-half" title="Poll Everywhere UI example" src="/images/blog/poll-book.png">
</figure>

Poll Everywhere was founded in 2008 with the goal of changing how audiences engage during presentations and events. Its founders recognized the need for a dynamic, interactive way to gather real-time feedback, create discussions, and enhance audience participation through more engaging and interactive experiences.

The tool [integrates](https://www.polleverywhere.com/app) with widespread communication and presentation tools like Microsoft Teams, PowerPoint, Keynote, Slack, Webex, and Google Slides, turning them into two-way, real-time conversation tools where users can respond to questions, vote, or leave comments using web, Android or iOS applications. The results instantly display on slides and screens. The application also offers enhanced collaboration features, data insights, and analytics for presenters.

## AnyCable for faster votes and feedback processing

The main feature of the Poll Everywhere product is a set of visualizations that update in real-time during a presentation to tally responses from Multiple Choice Activities, generate Word clouds on the fly as the audience writes in their responses, or spotlight the most popular submission in a company-wide question and answer session.

For visualization streaming, the team uses a home-grown, [open source solution](https://github.com/firehoseio/firehose) built on top of [EventMachine][]. Migrating their main real-time chart visualizations to Hotwire means using ActionCable for streaming updates. The product deals with highly burst-prone traffic since it’s centered around live audience engagement during presentations. It can’t take 1 second to process the vote of a participant from an audience of 20,000 because the presenter will have moved on to the next slide by the time all the votes come in.

Initially, Healthie used Action Cable for their real-time feature implementation. However, as their userbase started growing, it became increasingly disadvantageous to have the same web service responsible for handling both WebSockets connections, and ActionCable channel logic, as well as HTTP traffic on top of that.

The Poll Everywhere team initially tested ActionCable but was nervous about its performance for such a workload and wanted to make sure they chose a tool that met the real-time needs of the product.

TODO: video

They started to explore what the market could offer regarding high-performing solutions for building real-time communications. Since they had read about some Ruby on Rails applications whose teams had great results with AnyCable and had some experience with another Evil Martians open source product—[Overmind][]—they gave AnyCable Pro’s trial a shot to perform load-testing and to compare the results with their in-house solution.

During testing, they found that AnyCable could handle the same traffic simulations they ran against their in-house system, and that it actually had better horizontal scaling characteristics for the product’s workload. Plus, once AnyCable is 100% implemented, their solution can rely on AnyCable with no need for EventMachine, so the security team will greatly appreciate this dependency elimination.

Currently, the team has completed 10% of the AnyCable Pro roll-out within their real-time visualization infrastructure based on AWS deployed with Kubernetes. So far, there have been no stream performance issues.

The gradual migration stems from careful support for a 15-year-old codebase using different generations of frontend technologies from the past decade. The team is now migrating their visualizations toward using Hotwire. The system that uses AnyCable will be rolled out to 100% of their user base in June 2023.

> ​​The current monitoring results show that the latency of the already-deployed AnyCable is more predictable and doesn’t exceed a one-second response for up to 10 thousand connections (per server), while using Firehose they experience "spikes" where some clients receive a message 5-8 seconds later even within a small number of simultaneous connections (up to 2,000).

Whether you need real-time streaming, updates, notifications, chats, GPS trackers, or collaboration tools, don’t hesitate to [drop us a line](/#custom-solutions) to discuss how you can build your real-time features resource-friendly.

[hotwire]: https://hotwired.dev
[Poll Everywhere]: https://www.polleverywhere.com
[EventMachine]: https://github.com/eventmachine/eventmachine
[Overmind]: https://evilmartians.com/chronicles/introducing-overmind-and-hivemind
