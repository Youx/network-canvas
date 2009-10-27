<?php

require('config.php');

$str = $root.'/'.$user.'/'.$project.'/network_data_chunk?nethash='.$_GET['nethash'];
if (array_key_exists('start', $_GET)) {
	$str .= '&start='.$_GET['start'].'&end='.$_GET['end'];
}
echo(file_get_contents($str));
//echo $str;
?>
