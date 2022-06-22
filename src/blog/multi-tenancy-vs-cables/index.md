# Multi-tenancy vs. Cables:<br>Introducing Action Cable command callbacks

June 29, 2022
{date}

<br/>

Introducing multi-tenancy to a web application usually comes at a price: we need to (re-)design a database schema, make sure all kind of "requests" are bound to right tenants, etc. Luckily, for Rails applications we have [battle-tested tools][ruby-toolbox-multitenancy] to make developer lives easier. However, all of them focus on classic Rails _components_, controllers and background jobs. Who will take care of channels?
{intro}

<div class="divider"></div>

## Execution context, or how we usually implement tenant scoping

## Action Cable `around_command` to the rescue

<div class="divider"></div>

We considered only a single use case for command callbacks, though there is plenty others. For example, you can setup the current user's time zone or locale, or provide some context via [Current attributes][current] or [dry-effects][].
Give this feature a try with [anycable-rails][] today! (Even if you're not using AnyCable. Yet 😉)

[ruby-toolbox-multitenancy]: https://www.ruby-toolbox.com/categories/Multitenancy
[rails-pr]: https://github.com/rails/rails/pull/44696
[current]: https://edgeapi.rubyonrails.org/classes/ActiveSupport/CurrentAttributes.html
[dry-effects]: https://dry-rb.org/gems/dry-effects/
[anycable-rails]: https://github.com/anycable/anycable-rails