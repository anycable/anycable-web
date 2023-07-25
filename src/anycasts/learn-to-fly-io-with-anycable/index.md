# <img src="/images/demo.svg" class="blog--title-icon"> Learn to Fly.io with AnyCable

September 6, 2022
{date}

<br/>

<div class="divider"></div>

In this episode, we explore [Fly.io][fly] capabilities in deploying Rails real-time applications:

- Deploying a _pure_ Rails Action Cable application to Fly.
- Load-testing _Flying_ Action Cable with k6 and [xk6-cable][].
- Deploying [RPC-less][rpc-less-post] version of AnyCable and load-testing it.
- Adding RPC server to the equation with just a couple of configuration changes.
- Exporting [AnyCable metrics][anycable-metrics] to [fly-metrics.io][fly-metrics].

<figure class="blog--figure">
  <iframe class="blog--youtube" src="https://youtube.com/embed/j9JqlbMAQKY" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</figure>

<div class="divider"></div>

**Benchmark results**

- Action Cable server (single-worker Puma) crashed due to out-of-memory at about **700 concurrent connections**.
- AnyCable (RPC-less) passed **2700 concurrent connections** and consumed only a half of the available RAM (~120MB).

**Links**:

- [Official Fly deployment guide for AnyCable](https://docs.anycable.io/deployment/fly)
- [Fly.io Rails guides][fly-rails]
- [Real-time stress: AnyCable, k6, WebSockets, and Yabeda][yabeda-post]

**Errata**:

- Getting an app's Ruby version from the Gemfile has been fixed in the recent `flyctl` versions (see [issue](https://github.com/superfly/flyctl/issues/1242))

- Redis connections termination is intentional and has nothing with load-testing. See [the Fly docs](https://fly.io/docs/rails/getting-started/#patching-action-cable-to-handle-redis-timeouts)

[fly]: https://fly.io
[pro]: https://anycable.io/#pro
[sponsors]: https://github.com/sponsors/anycable
[xk6-cable]: https://github.com/anycable/xk6-cable
[yabeda-post]: https://evilmartians.com/chronicles/real-time-stress-anycable-k6-websockets-and-yabeda?utm_source=anycable-web
[rpc-less-post]: /blog/jwt-identification-and-hot-streams/
[fly-metrics]: https://fly.io/docs/reference/metrics/
[anycable-metrics]: https://docs.anycable.io/anycable-go/instrumentation
[fly-rails]: https://fly.io/docs/rails/
