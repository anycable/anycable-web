# <img src="/images/demo.svg" class="blog--title-icon"> Flying multi-regionally with NATS

March 24, 2023
{date}

<br/>

<div class="divider"></div>

In this episode, we explore the recently released [embedded NATS support][enats] in AnyCable-Go and see how it can be used to simplify building multi-regional Rails/AnyCable applications on [Fly.io][fly].

<figure class="blog--figure">
  <iframe class="blog--youtube" src="https://youtube.com/embed/TUHL5jb9jBo" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</figure>

<div class="divider"></div>

The topics covered in this video:

- Different pub/sub topologies for Action Cable and AnyCable applications.
- AnyCable-Go v1.3 [configuration presents][presets] and how they simplify setting up AnyCable on Fly.
- Switching from Redis to embedded NATS for pub/sub.
- Fly regions and the [fly-prefer-region][] header.
- Using [ACLI][] to debug and test AnyCable applications from the command line.
- NATS [super-clusters and gateways][nats-gateways].

[fly]: https://fly.io
[sponsors]: https://github.com/sponsors/anycable
[presets]: https://docs.anycable.io/anycable-go/configuration?id=presets
[fly-prefer-region]: https://fly.io/docs/reference/dynamic-request-routing/#the-fly-prefer-region-request-header
[ACLI]: https://github.com/palkan/acli
[enats]: https://docs.anycable.io/anycable-go/embedded_nats
[nats-gateways]: https://docs.nats.io/nats-server/configuration/gateways
