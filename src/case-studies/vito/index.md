# Revitalizing Vito with AnyCable Pro

January 25, 2022
{date}

Migrating from standard Action Cable to AnyCable Pro helped Vito, an online community and events platform, quickly solve scaling problems, squeeze more performance out of their existing infrastructure, and host the major [Nuxt Nation][] conference.
{intro}

<div class="divider"></div>

[Vito][] is a Ruby on Rails online platform that lets users create instant, live, social hubs, perfect for live—streaming or hybrid events. Initially, the platform's real-time communication features—a chat, notifications, and live content updateswere built with Action Cable, but their first big event resulted in some serious scaling headaches. This event required larger Heroku dyno sizes—with all of them maxed out—to handle a few thousand simultaneous connections. The Vito team hit limitations before they had even properly gotten started.

## Migrating from Action Cable

While preparing for one of Vito’s critical events—the Nuxt Nation conference with 20,000 registered developers—Vito turned to [Evil Martians][], who had previously helped the team with frontend and backend engineering, to resolve these issues. They began a conversation that ultimately led to migrating to AnyCable Pro.

From their experience with another product, [Tito][] (a platform for selling tickets online), the Vito team realized that event software has a slightly different scaling profile than other types of software. This involves long periods of quiet time interspersed with very busy periods during events themselves. The Vito platform needed something that would have extreme efficiency out of the box and that would be able to handle thousands of concurrent users, all updating live simultaneously. Further, they needed a solution that would be Action Cable compatible and that could be implemented with no major changes to their Ruby app. For these reasons, they were drawn to AnyCable—a perfect fit for all of the above.

Evil Martians designed the infrastructure to deploy AnyCable and switch to Pro: a Kubernetes cluster on AWS EKS with databases based on RDS and cache servers on Elasticache. Vito's core team built and deployed pipelines on buildkite.com and used Helm to upgrade their deployments with images built during the CI step. Adding AnyCable to the stack only took a few days.

The Vito team didn't want to tinker away configuring Ruby on Rails to align with AnyCable—and they didn't have to. The Docker image easily sat alongside their other Docker-based deployment dependencies—adding an AnyCable service fit in perfectly with their other deployed services.

## Preparing for the storm

In October 2021, the Vito platform held one of their largest conferences yet, [Nuxt Nation][]. It saw a total of 8,000 visitors, with over 3,000 concurrent visitors at its peak. Advance preparations were necessary and began 3 months before the big day.

Ahead of the event, with the help of Evil Martians, the Vito team went through some basic performance optimizations: checking for slow queries in the app's main API endpoints and ensuring that the database had all of the requisite indexes.

Since the original version of Vito was built as a response to the coronavirus pandemic, it was put together in such a short time that inevitably, performance issues arose. These were refactored and refined. Finally, they created a series of load-testing scenarios and used k6 to flood the servers to determine their maximum capacity at various configurations.

Evil Martians helped augment the Vito team's load-testing with Martian testing, including WebSockets and tests with different AnyCable configurations. This gave Vito confidence that they would be able to handle more than even the highest predicted load of visitors.

## Bugs and debugging

After such meticulous preparations, what could go wrong? During stress testing, we noticed a problem—requests were no longer being served, though metrics remained constant—we determined that the issue was specific to the testing setup, and noted that it would be best to fix it after the event. But then, in the midst of the event, the problem re-emerged.

Because AnyCable Pro includes priority support, the Evil Martians team rushed to solve the issue. After finding it, the bug was fixed within approximately 1 hour. As it turned out, a deadlock had occurred due to improper usage of sync.RWMutex, and we had to renew our mutext relations (we revealed our investigation and the fix in [this article](https://evilmartians.com/chronicles/what-could-go-wrong-with-a-mutex-or-the-go-profiling-story).)

Once this was implemented, the event went off smoothly without a hitch.

## More events to watch with AnyCable Pro

AnyCable Pro now powers Vito’s notifications and live-updating features: every piece of content on Vito updates live without requiring a refresh, with updates happening over WebSockets. Vito also includes a WebSocket-powered live chat feature which is backed by AnyCable.

In the past months, several high-profile events have been held on the Vito platform: [ReactJS Girls](https://twitter.com/ReactJSgirls), [Beyond Tellerrand](https://beyondtellerrand.com), [Buildkite’s developer conference Unblock Conf](https://unblockconf.dev/21), and [Halfstack Online Series 1](https://halfstackconf.com).

And here's something cool: Vito is giving away 10 free passes for their [Halfstack Series](https://halfstackconf.com/). For your chance to win, share your favourite developer story from the last year and a half; just send a tweet to [@vitocommunity](https://twitter.com/vitocommunity).

You can [learn more](/#pro) about building real-time features for Rails apps and scaling them efficiently with AnyCable Pro.

[Vito]: https://vi.to/
[Tito]: https://ti.to/
[Evil Martians]: https://evilmartians.com
[Nuxt Nation]: https://nuxtnation.com/
