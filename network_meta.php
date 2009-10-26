<?php

require('config.php');

$str = $root.'/'.$user.'/'.$project.'/network_meta';
echo(file_get_contents($str));

?>
