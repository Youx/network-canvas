network-canvas
==============

What it is
----------

network-canvas is a reimplementation of github's network graph using HTML5 canvas element instead of flash.

AFAIK, Canvas is supported by chrome, firefox 3+, opera and safari, so unless you are using IE or an old version of these browsers you shouldn't have any problem.

Live example
------------

Try it here, it uses mojombo/eventmachine as a sample project : [example](http://hugo.golgoth.net/network-canvas)

How to use it
-------------

This is currently alpha quality, NOT FOR USE. You've been warned.

First, grab the code, put it in an apache folder, and try accessing index.html.

Since we can't do AJAX requests to external servers (that would be cross site scripting, considered by browsers as an attack vector), we have to use a php script to proxy the request to retrieve the data chunks from github.

The stored data used (`network_data` and `network_meta` files) is taken from mojombo's jekyll project, as is dynamically loaded data.

Screenshot
----------

![Screenshot as of 23/10/2009](http://cloud.github.com/downloads/Youx/network-canvas/network-canvas.png)
