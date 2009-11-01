#!/usr/bin/env ruby

require 'net/http'

app = proc do |ev|
  ret = ""
  options = {}
  req_path = ev['REQUEST_PATH'].split('/')
  options[:user] = req_path[1]
  options[:repo] = req_path[2]
  options[:page] = req_path[3]
  case options[:page]
    when 'network_meta'
      puts("=> http://github.com#{ev['REQUEST_URI']}")
      ret = Net::HTTP.get('github.com', ev["REQUEST_URI"])
      typ = 'text/json'
    when 'network_data_chunk'
      puts("=> http://github.com#{ev['REQUEST_URI']}")
      ret = Net::HTTP.get('github.com', ev["REQUEST_URI"])
      typ = 'text/json'
    when 'network.js'
      ret = File.read('network.js')
      typ = 'text/javascript'
    when 'network'
      ret = File.read('index.html')
      typ = 'text/html'
    else
      nil
  end

  return [ 200,
    {'Content-Type' => typ,
    'Content-Length' => ret.length.to_s},
    [ret] ]
end

use Rack::CommonLogger

run app
