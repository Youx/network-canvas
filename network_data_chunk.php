<?php

require('config.php');

$str = $root.'/'.$user.'/'.$project.'/network_data_chunk?nethash='.$_GET['nethash'];
if ($_GET['start']) {
	$str .= '&start='.$_GET['start'].'&end='.$_GET['end'];
}
echo(file_get_contents($str));
//echo $str;
?>
