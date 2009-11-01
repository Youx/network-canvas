network-canvas
==============

What it is
----------

network-canvas is a reimplementation of github's network graph using HTML5 canvas element instead of flash.

AFAIK, Canvas is supported by chrome, firefox 3+, opera and safari, so unless you are using IE or an old version of these browsers you shouldn't have any problem.

Note that the original network flash file is 110kB large. The network.js file is only 25kB! Even better, it can be shrinked to less than 4kB by using [YUICompressor](http://developer.yahoo.com/yui/compressor) on the file and gzip compression on your server.

Live example
------------

Check [this](http://hugo.golgoth.net:3000/mojombo/eventmachine/network) out!

How to use it
-------------

You will need to have [Thin](http://code.macournoyer.com/thin/) installed (use gem).

Run ./server.sh, then just point your browser to http://localhost:3000/&lt;user>/&lt;repo>/network to get the network graph for a given user/repository.

Example : http://localhost:3000/mojombo/eventmachine/network

Screenshot
----------

![Screenshot as of 23/10/2009](http://cloud.github.com/downloads/Youx/network-canvas/network-canvas.png)
