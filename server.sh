#!/bin/sh

case "$1" in
'--offline')
  echo 'Running server in offline mode.'
  thin start -R offline.ru;
  ;;
'--help')
  echo 'network-canvas proxy server';
  echo $0
  echo '--help		-- show this help'
  echo '--offline	-- run in offline mode instead of proxy mode'
  ;;
*)
  echo 'Running server in proxy mode.'
  thin start -R server.ru
esac
