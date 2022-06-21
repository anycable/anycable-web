# Making a chat’s real-time functionality Healthie-r with AnyCable Pro

June 25, 2022
{date}

By implementing a gradual migration of the app's real-time features from Action Cable to AnyCable, we were able to solve Healthie's challenge and release a new version of AnyCable with dual broadcast strategy support.
{intro}

<div class="divider"></div>

[Healthie][] is a comprehensive software that serves as the underlying infrastructure for digital health organizations of all sizes who seek to offer best-in-class, customizable experiences and to scale a provider network for longitudinal care delivery.

Healthie offers a fully brandable web and mobile platform and an API layer for onboarding, booking, engagement, and EHR capabilities. It also offers a built-in marketplace of business and clinical integrations utilized by their client organizations. The app enables the next generation of healthcare builders to avoid reinventing the wheel when launching and scaling engaging healthcare experiences.

## Switching from Action Cable

Initially, Healthie used Action Cable for their real-time feature implementation. However, as their userbase started growing, it became increasingly disadvantageous to have the same web service responsible for handling both WebSockets connections, and ActionCable channel logic, as well as HTTP traffic on top of that.

_"AnyCable has been on our radar for several years and has always seemed like an elegant solution. When looking at it again recently when deciding to switch, I was happy to see that it has continued to be maintained and now has a Pro version, with improved features and support."_—**John Bachir, Director of Engineering at Healthie**

Healthie plans to make the switch from GraphQL to Apollo and AnyCable Pro's [built-in support][anycable-apollo] for the latter was one of the reasons they chose Pro.

## Action Cable + AnyCable in parallel

Many users and teams try AnyCable’s OSS version before later deciding to upgrade to Pro to take advantage of its priority support and advanced features. However, the Healthie team decided to skip using OSS and to take advantage of Pro’s benefits immediately.

Deployment of AnyCable Pro typically requires a few days for initial implementation followed by a short period of time to iron out any support team wrinkles. The deployment timeline for Healthie, however, was longer because the project required the use of some atypical infrastructure.

Although the implementation was made a bit easier because the Healthie application was based on a PAAS which, unlike Heroku, supported multiple internet-facing services per app, the team also needed to deal with some legacy software, like outdated versions of some libraries. Therefore, the Healthie developers decided to gradually migrate from Action Cable.

In order to do this, Action Cable and AnyCable had to be used in parallel: some clients connected to the legacy Action Cable WebSocket server, while others connected to the new AnyCable one. Together with the Evil Martians team, the Healthie engineers came up with the dual broadcast strategy—which eventually became a part of AnyCable itself ([since v1.3.0](https://github.com/anycable/anycable-rails/releases/tag/v1.3.0)).

_"The hands-on support has been fantastic—the AnyCable team is very helpful. Our implementation was a bit atypical, and I received all the help I needed to get things up and running. And of course, we like to benefit from the improved performance of the AnyCable Pro binary."_—**John Bachir, Director of Engineering at Healthie**

> Today, AnyCable serves one of Healthie’s critical business features—a chat system that allows 1-1 as well as group chats between healthcare professionals and their clients (e.g., a dietitian and their client). Additionally, chats can be held both on the web or using a mobile app. The team plans to leverage additional features such as Apollo GraphQL compatibility soon.

[Learn more about Pro](/#pro) and choose a plan that fits your project's needs—Basic, Standard, or Enterprise.

[Healthie]: https://www.gethealthie.com
[Evil Martians]: https://evilmartians.com
[anycable-apollo]: https://docs.anycable.io/anycable-go/apollo
