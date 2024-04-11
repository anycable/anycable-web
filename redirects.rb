require 'bundler/inline'

gemfile(true) do
  source 'https://rubygems.org'
  gem 'toml-rb'
end

require 'toml-rb'
require 'fileutils'

config = TomlRB.load_file('netlify.toml')
redirects = config['redirects']

html = <<~HTML
  <!DOCTYPE html>
  <meta charset=utf-8>
  <title>Redirecting...</title>
  <link rel=canonical href="%%URL%%">
  <meta http-equiv=refresh content="0; url=%%URL%%">
HTML

# Check each redirect
redirects.each do |redirect|
  # Construct the path from the 'from' field
  path = redirect['from'][1..-1]  # Remove the leading slash
  index = File.join('src', path, 'index.html')

  next unless File.exist?(index)

  contents = File.read(index)
  next if contents.include?('<meta http-equiv="refresh"')

  new_contents = html.gsub('%%URL%%', redirect['to'])

  if ENV["DRY_RUN"]
    puts "\nUpdate #{index} with #{new_contents}\n"
  else
    File.write(index, new_contents)
    puts "Updated #{index}"
  end
end
