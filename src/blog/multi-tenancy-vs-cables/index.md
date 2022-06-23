# Multi-tenancy vs. Cables:<br>Introducing Action Cable command callbacks

June 29, 2022
{date}

<br/>

Introducing multi-tenancy to a web application usually comes at a price: we need to (re-)design a database schema, make sure all kinds of "requests" are bound to the right tenants, and so on. Luckily, for Rails applications we have [battle-tested tools][ruby-toolbox-multitenancy] to make developers' lives easier. However, all of them focus on classic Rails _components_, controllers, and background jobs. Who will take care of the channels?
{intro}

<div class="divider"></div>

## Execution context, or how tenant scoping is usually implemented

Multi-tenancy could be implemented in many different ways, but most of them include the following phases: 1) retrieving a tenant (e.g., from request properties), and 2) storing the current tenant within the current _execution context_.

What is _execution context_? We might say that it's a _unit of work_ in a web application, with a clearly defined beginning and end. Web requests and background jobs are examples of execution contexts.

In Ruby, an execution context is usually _connected_ to a single Thread or [Fiber][]. Thus, most multi-tenancy libraries use [Fiber local variables][fiber-locals] to store the current tenant information. For example, [acts_as_tenant][] relies on the good ole [request_store][] gem, which provides a wrapper for `Thread.current` and takes care of clearing the state when a [request completes](https://github.com/steveklabnik/request_store/blob/f79bd375e88f434428b876dbb5c8a51b569712aa/lib/request_store/middleware.rb#L29-L33). All you need is to set a tenant in your controller (usually, in a `before_action` hook):

```ruby
class ApplicationController < ActionController::Base
  before_action do
    current_account = find_account_from_request_or_whatever
    set_current_tenant(current_account)
  end
end
```

Easily done. We have lifecycle APIs in our controllers (action callbacks), which make injecting some logic before (or after) any _unit of work_ pretty straightforward. We can also go one step above and rely on Rack middlewares (like [Apartment does](https://github.com/influitive/apartment/blob/f266f73e58835f94e4ec7c16f28443fe5eada1ac/lib/apartment/elevators/generic.rb#L15)).

What about Action Cable?

First, let's think— what is the execution context for sockets? Cable connections are persistent and long-lived; they have a beginning (`connect`) and end (`disconnect`), but these are not our execution context boundaries. So, what are then?

The way Action Cable works under the hood could give us a hint. How many concurrent clients could be handled by a Ruby server? (We're not talking about AnyCable right now). Maybe, we could spawn a Thread per connection? That would quickly blow up due to high resource usage. Instead, Action Cable relies on an [event loop][ac-event-loop] and a [Thread pool executor][ac-thread-pool] (i.e., a fixed number of worker threads). Whenever we need to process an incoming "message" from a client, we fetch a worker Thread from the pool and use it to process the message. And this is our _unit of work_ (and a random Thread from the pool is our _execution context_). I put the "message" in quotes because we also use the pool to process connection initialization (`Connection#connect`) and closure (`Connection#disconnect`) events, which are not messages.

Now, let's take a look at the naive approach to configuring a tenant for Action Cable connections:

```ruby
module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user, :tenant

    def connect
      self.tenant = request.subdomain
      Apartment::Tenant.switch!(tenant)
    end
  end
end
```

Looks similar to what we do in controllers, right? The problem here is that when the next message (say, channel subscription) is processed by this connection, we may have incorrect tenant information because the execution context has likely changed (a different Thread is processing the message). This could mess things up.

**NOTE:** AnyCable also uses a thread pool under the hood (it's a part of a gRPC server).

We can probably fix this by adding `before_subscribe` to our `ApplicationCable::Channel` and calling `switch!(tenant)` there, too. And we should probably add `after_subscribe` to reset the state (otherwise our tenant could leak into `Connection#connect` and `Connection#disconnect` methods).

Alternatively, we can hack around the Connection class and make sure the correct tenant is set up before we enter channels:

```ruby
module ApplicationCable
  class Connection < ActionCable::Connection::Base
    # ...

    # Make all channel commands tenant-aware
    def dispatch_websocket_message(*)
      using_current_tenant { super }
    end
  end
end
```

This is my preferred way of dealing with multi-tenancy. I believe that the connection is the right place for dealing with _scoping_, and that channels should not deal with it. The only problem with this approach is that it relies on Action Cable internals. And it's also incompatible with AnyCable (which doesn't use `#dispatch_websocket_message`), so we had to patch two methods to work with AnyCable:

```ruby
module ApplicationCable
  class Connection < ActionCable::Connection::Base
    # ...

    # Make all channel commands tenant-aware
    def dispatch_websocket_message(*)
      using_current_tenant { super }
    end

    # The same override for AnyCable, which uses a different method
    def handle_channel_command(*)
      using_current_tenant { super }
    end
  end
end
```

The patching and duplication didn't look good to me, so I decided to fix it once and for all—let me share a bit of Rails 7.1 with you.

## Action Cable `around_command` to the rescue

The search for a better API didn't take too long: Rails is built on top of conventions, and there is no better way to extend the framework than to follow these conventions. In this particular case, I decided to go with _callbacks_. Every Rails developer is familiar with callbacks, right?

I'm glad to introduce [**command callbacks** for Connection classes][rails-pr]: `before_command`, `after_command`, and `around_command`. They do literally what they say: allow you to execute the code before, after, or around channel commands.

And this is how our multi-tenancy problem could be solved via the `around_command` callback:

```ruby
module ApplicationCable
  class Connection < ActionCable::Connection::Base
    around_command :set_current_tenant

    attr_reader :tenant

    def connect
      @tenant = request.subdomain
    end

    private

    def set_current_tenant
      with_tenant(tenant) { yield }
    end
  end
end
```

Awesome! The only downside is that it's only available since Rails 7.1.

> We made AnyCable compatible with this feature, but there's more: our Rails integration includes a backport for command callbacks for older Rails versions. Just drop [`anycable-rails`][anycable-rails] to your Gemfile and use future Rails APIs!

<div class="divider"></div>

We only considered a single use case for command callbacks, though there are plenty of others. For example, you could set the current user's time zone or locale, or provide some context via [Current attributes][current] or [dry-effects][].

Give this feature a try with [anycable-rails][] today! (Even if you're not using AnyCable... yet 😉)

[ruby-toolbox-multitenancy]: https://www.ruby-toolbox.com/categories/Multitenancy
[rails-pr]: https://github.com/rails/rails/pull/44696
[current]: https://edgeapi.rubyonrails.org/classes/ActiveSupport/CurrentAttributes.html
[dry-effects]: https://dry-rb.org/gems/dry-effects/
[anycable-rails]: https://github.com/anycable/anycable-rails
[Fiber]: https://rubyapi.org/3.1/o/fiber
[fiber-locals]: https://rubyapi.org/3.1/o/thread#method-i-5B-5D
[request_store]: https://github.com/steveklabnik/request_store
[acts_as_tenant]: https://github.com/ErwinM/acts_as_tenant
[ac-event-loop]: https://github.com/rails/rails/blob/1003e974ed9cdae6a057a1857374bceb09b34a7b/actioncable/lib/action_cable/connection/stream_event_loop.rb#L7
[ac-thread-pool]: https://github.com/rails/rails/blob/1003e974ed9cdae6a057a1857374bceb09b34a7b/actioncable/lib/action_cable/server/worker.rb#L10
