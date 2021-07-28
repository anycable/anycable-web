# A call for Pro: Callbell

August, 3, 2021
{date}

The Callbell project was one of the first to reach out to us for early access to AnyCable Pro and became the first to launch the Pro version into production. In addition to new features, priority support, and reduced memory footprint, they also managed to halve the number of dyno instances in the Heroku infrastructure where they deployed their application and the product.
{intro}

<div class="divider"></div>

[Callbell][] is a shared inbox for teams that enables businesses to efficiently support their customer base through WhatsApp, Facebook Messenger, Instagram, and Telegram. The application is trusted by more than 75,000 companies around the globe, including giants like LG and Hugo Boss.

They started their MVP by using ActionCable, which worked great until they hit around 200 concurrent clients in production with customers literally from all around the world. While they were pretty happy with the development cycle, the Callbell team quickly realized that the ActionCable and Rails bundle wasn't that great at scaling. The team even considered rewriting the application using Golang and gRPC ([sounds familiar][anycable-post], doesn’t it?)

But while they were struggling to scale up ActionCable, AnyCable caught their eyes. The project was doing exactly what they were looking for: scaling up to tens of thousands of clients with the commodity of writing business logic in both Ruby and Rails. There was no need to rewrite anything: AnyCable engaged the best of two worlds and fitted perfectly.

They've moved to the open source version of AnyCable and have been using it for almost two years for the most critical part of the product—their chat inbox. Callbell is a product that is entirely focused on real-time messaging integrations/APIs, so they have a strong requirement to use WebSockets inside their UI.

_"My number one reason is that everything about AnyCable is very well explained, from the architecture to the WebSocket servers. Everything clicked immediately from day 1. This has a huge advantage compared to choosing a proprietary, closed-source SaaS as we feel more in control and have a better understanding of what's going on."_—**Gianluca Bargelli, Co-founder & CTO at Callbell**

When Callbell got a Pro version, they integrated it directly to their Heroku-based production environment since AnyCable Pro [Heroku buildpack][buildpack] supports downloading Pro binaries without any additional hassle. Testing AnyCable Pro took roughly a day of work with exactly zero issues. The migration from AnyCable to AnyCable Pro went fast and smoothly: it was a matter of changing a couple of config variables.

> The immediate benefit they had was halving their dyno instances by half. The features the Callbell team is planning to leverage heavily for both their API and mobile apps are in binary formats, so the support AnyCable Pro provides for binary communication protocols for bandwidth savings can be helpful.

As explained by Gianluca Bargelli, co-founder and CTO at Callbell, any Rails app that needs real-time WebSocket updates without having to change stack completely—messaging apps, customer support tools, email clients, etc.—will find AnyCable a great fit. Leveraging AnyCable can allow them to scale up way beyond Rails' vision while staying in a comfortable and battle-tested environment.

[Callbell]: https://www.callbell.eu/
[anycable-post]: https://evilmartians.com/chronicles/anycable-actioncable-on-steroids
[buildpack]: https://github.com/anycable/heroku-anycable-go
