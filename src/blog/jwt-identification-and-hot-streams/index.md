# AnyCable v1.2:<br>JWT identification and "hot streams"

September 29, 2021
{date}

**Update (2021-12-21)**: Both features, JWT auth and Hotwire/CableReady speedy streams, were moved into the OSS version of AnyCable. Enjoy!

<br/>

We've just launched the final [AnyCable PRO][pro] release, bringing advanced features and a 40% lower memory footprint to AnyCable—the product for building real-time features for Ruby on Rails apps. The two brand-new PRO features we're presenting in the post, [JWT identification][jwt-id-docs] and [signed streams support][signed-streams-docs], arrived from the Early Access program. We asked its adopters to share how they use _cables_ and which features they would like us to provide out of the box. They might seem unrelated to each other at first glance, but when used together, they have the potential to bring about a huge performance boost.
{intro}

<div class="divider"></div>

## Dealing with authentication

Amongst all the requested features, one of the leading requests was a "token-based authentication". AnyCable relies on the Action Cable API (although it can work outside of Rails), and most Action Cable applications utilize cookies as an authentication mechanism (either directly or via sessions). The main benefit of cookie-based authentication is simplicity—it just works. However, there are some drawbacks:

- Authenticating non-web clients (e.g., mobile apps) is cumbersome.
- Rails API-only apps usually do not use cookies for web clients authentication (they use tokens).
- WebSockets do not offer CORS support and, thus, are **vulnerable to cross-site request forgery** (or [cross-site WebSocket hijacking][cross-site-ws-hijack]).

Using tokens could certainly help us solve these problems—but what's the catch? Well, we'd have to build everything ourselves, both the server, and the client side (and good luck actually finding a library or gem which makes this process easier instead of harder).

While I was thinking about how to incorporate tokens into AnyCable, I realized that we could also leverage this feature to improve performance. Tokens could also be made to carry **identification** information, and therefore could be used instead of calling an RPC server (`Authenticate` method).

Let's recall how Action Cable (and AnyCable) work in the context of authentication and identification.

Whenever a new connection opens, the `ApplicationCable::Connection#connect` method is called. This is the place where you can reject the connection ([`#reject_unathorized_connection`][reject-connection]) and where you configure the so-called _connection identifiers_ ([`.identifed_by`][ac-identifiers]). The identifiers represent the client state which could be used by channels (e.g., `current_user` or `current_tenant`). AnyCable obtains the identifiers during the `Authenticate` call and passes along all subsequent requests (in a [serialized form][identifiers-serialization]).

To sum everything up, all we need from the `#connect` method is to accept or reject the connection and populate the identifiers. And we can encapsulate all this logic within a single [JWT][] token!

This is how it might look written in pure Ruby. First, let's create a helper to build a connection URL with a token:

```ruby
class ApplicationHelper
  def action_cable_with_jwt_meta_tag(**identifiers)
    # Token TTL (5 minutes)
    exp = Time.now.to_i + 60*5
    # JWT payload.
    # The #serialize_identifiers is responsible for serializing objects into strings
    # (AnyCable uses GlobalID for that)
    payload = {ext: serialize_identifiers(identifiers), exp: exp}

    token = JWT.encode payload, JWT_ENCRYPTION_KEY, "HS256"

    base_url = ActionCable.server.config.url || ActionCable.server.config.mount_path
    tag "meta", name: "action-cable-url", content: "#{base_url}?token=#{token}"
  end
end
```

Now we can add it to our layout:

```erb
<%= action_cable_with_jwt_meta_tag(current_user: current_user) %> would render:
# => <meta name="action-cable-url" content="ws://demo.anycable.io/cable?token=eyJhbGciOiJIUzI1NiJ9....EWCEzziOx3sKyMoNzBt20a3QvhEdxJXCXaZsA-f-UzU" />
```

Finally, we need to verify the token and extract the identifiers in the `#connect` method:

```ruby
module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      token = request.params[:token]

      decoded_token = JWT.decode token, JWT_ENCRYPTION_KEY, true, { algorithm: "HS256" }
      # The #deserialize_identifiers method is a counterpart to #serialize_identifiers
      # and is responsible for converting strings back to objects
      identifiers = deserialize_identifiers(JSON.parse(decoded_token["ext"]))

      # Populate identifiers
      identifiers.each do |k, v|
        self.public_send("#{k}=", v)
      end
    rescue JWT::DecodeError
      reject_unauthorized_connection
    end
  end
end
```

This doesn't look like such a simple solution, after all 😕 If you continue staring at this piece of code for a bit longer, you might notice that this implementation contains nothing specific to a particular application: we retrieve a token, verify it, and extract the identifiers. If this is the case, why can't we just re-implement this in Go? Well, we can!

This is how AnyCable Go PRO JWT identification works:

- A client passes a token along with the connection request (via a query string or a header).
- A Go server retrieves a header, verifies its signature and TTL, and rejects the connection if token is invalid.
- If the token is valid, we extract the identifiers, store them in the connection metadata and finalize the handshake (by sending a `{"type":"welcome"}` message).

And we don't have to perform any RPC calls! Let's see how it affects the connection time:

<figure class="blog--figure">
<video loop="loop" muted="muted" autoplay="autoplay" playsinline="true" width="1221" height="800" class="blog--media">
  <source src="/images/blog/connect-benchmark.h264.mp4" ttype="video/mp4; codecs=avc1.4D401E,mp4a.40.2">
</video>
</figure>

It's more than 2x faster now! And even more importantly, we've reduced the stress on the RPC server. This could be especially useful during _connection avalanches_.

> JWT identification allows you to standardize the authentication flow for WebSockets, protects from cross-site WebSocket hijacking and results in a performance boost!

Luckily, you don't need to write any of the code above yourself, even the token generation part is done for you via a little companion gem called [anycable-rails-jwt][].

The only question left: how can we gracefully handle token expiration? AnyCable Go uses a specific disconnect message to distinguish expiration from unauthorized access (sends a `{"type":"disconnect","reason":"token_expired"}` message). You can use it to refresh the token. Again, we're glad to provide an out-of-the-box solution for this in our brand new [anycable-client-refresh-tokens][]!

## "Hot-wiring" Action Cable subscriptions

We've collected more than a hundred responses from Action Cable and AnyCable users around the world, and we found that a good portion of them build applications on top of [Hotwire][hotwire] or [Stimulus Reflex][sr] (+ [CableReady][cr]). This is pretty cool: [_frontendless_ Rails frontend][frontendless-rails] is gaining more and more traction!

What can AnyCable do for these users? Let's take a look at how Turbo Streams work with Rails.

Let's start with the [turbo-rails][] gem, which integrates Action Cable with Hotwire. You just need to drop a helper into your template to start consuming streams:

```erb
<%= turbo_stream_from some_model %>
```

The helper adds a [`<turbo-cable-stream-source>` element][turbo-cable-stream-source], which initiates an Action Cable subscription. The corresponding server-side code is as follows:

```ruby
class Turbo::StreamsChannel < ActionCable::Channel::Base
  extend Turbo::Streams::Broadcasts, Turbo::Streams::StreamName

  def subscribed
    if verified_stream_name = self.class.verified_stream_name(params[:signed_stream_name])
      stream_from verified_stream_name
    else
      reject
    end
  end
end
```

The `#verified_stream_name` method uses an [`ActiveSupport::MessageVerifier`][message-verifier] to decode and verify the stream name. The subscription is rejected if the signed stream name is invalid.

Structurally speaking, the code above is the same as the example we wrote for JWT identification. What does this mean? It means that, **once again**, we can "move" the implementation to an AnyCable Go server and **create subscriptions without touching RPC**.

This is exactly what we did as a part of the [signed streams][signed-streams-docs] feature. Further, we did it not only for Turbo Streams, but for CableReady as well (since its [`#stream_from` implementation][cr-stream-from] is nearly the same).

> By combining JWT identification with signed streams, it's possible to completely avoid running an RPC server, in case you only need to use Hotwire or CableReady functionality.

Below is a visualization of RPC server metrics during Hotwire benchmarks with four different configurations (denoted by blue markers), from left to right: baseline (AnyCable PRO without any features enabled), with JWT identification, with signed streams, and with both features enabled at the same time.

<figure class="blog--figure">
  <img class="blog--media" title="AnyCable metrics when running with and without JWT and 'hot' streams" src="/images/blog/grafana.png" width="1364" height="624">
</figure>

It shouldn't come as any surprise that the last one shows zeros for RPC metrics—it wasn't impacted at all. We can also note that CPU usage with AnyCable Go is the lowest in the fourth scenario—**dealing with tokens and signatures is "cheaper" than performing gRPC calls**.

<div class="divider"></div>

We've added these features in response to your needs. We believe that, thanks to user feedback, we're able to build a much better product together. Who knows? Maybe your request will be the next feature we add! Ready to get started? Give [AnyCable a try today](/)!

[pro]: https://anycable.io/#pro
[hotwire]: https://hotwired.dev
[sr]: https://docs.stimulusreflex.com
[cr]: https://cableready.stimulusreflex.com
[jwt-id-docs]: https://docs.anycable.io/anycable-go/jwt_identification
[signed-streams-docs]: https://docs.anycable.io/anycable-go/signed_streams
[frontendless-rails]: https://noti.st/palkan/eVl0xO/frontendless-rails-frontend
[cross-site-ws-hijack]: https://portswigger.net/web-security/websockets/cross-site-websocket-hijacking
[ac-identifiers]: https://api.rubyonrails.org/v6.1.4/classes/ActionCable/Connection/Identification/ClassMethods.html#method-i-identified_by
[reject-connection]: https://api.rubyonrails.org/classes/ActionCable/Connection/Authorization.html#method-i-reject_unauthorized_connection
[identifiers-serialization]: https://github.com/anycable/anycable-rails/blob/master/lib/anycable/rails/actioncable/connection/serializable_identification.rb
[JWT]: https://jwt.io
[anycable-rails-jwt]: https://github.com/anycable/anycable-rails-jwt
[anycable-client]: https://github.com/anycable/anycable-client
[turbo-rails]: https://github.com/hotwired/turbo-rails
[turbo-rails-channel]: https://github.com/hotwired/turbo-rails/blob/main/app/channels/turbo/streams_channel.rb
[turbo-cable-stream-source]: https://github.com/hotwired/turbo/blob/main/src/elements/stream_element.ts
[message-verifier]: https://api.rubyonrails.org/v6.1.4/classes/ActiveSupport/MessageVerifier.html
[cr-stream-from]: https://github.com/stimulusreflex/cable_ready/blob/master/app/channels/cable_ready/stream.rb
[anycable-client-refresh-tokens]: https://github.com/anycable/anycable-client#refreshing-authentication-tokens
