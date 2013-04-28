<?php

// ini_set('display_errors', '1');
// error_reporting(E_ERROR | E_WARNING | E_PARSE);


// connect to database
include ('dbconnect.php');

// get all image coordinates
$result = mysql_query( "SELECT lat, lon FROM images");

// create world map
while ($row = mysql_fetch_array($result, MYSQL_ASSOC)) {

        $coords[] = array( $row['lat'], $row['lon'] );

}

// create an image with this set of coordinates
createWorldMap($coords);


function createWorldMap($coords) {

	// First we load the background/base map. We assume it's located in same dir as the script.
	// This can be any format but we are using JPG in this example // We will also allocate the color for the marker 

	$im = imagecreatefromjpeg("earth.jpg");
	$color = imagecolorallocate ($im, 245,245,45);

	// Next need to find the base image size.
	// We need these variables to be able scale the long/lat coordinates.
	$scale_x = imagesx($im);
	$scale_y = imagesy($im); 


	foreach ( $coords as $c ) {

		$lat = $c[0];
		$long = $c[1];

		$pt = getlocationcoords($lat, $long, $scale_x, $scale_y);

		// Now mark the point on the map using a red 2 pixel circle 
		// imagefilledrectangle($im,$pt["x"]-2,$pt["y"]-2,$pt["x"]+2,$pt["y"]+2,$red);
		imagefilledellipse ($im,$pt["x"],$pt["y"],1,1,$color);

	}

	// imagestring($im,2,1,$scale_y-20,"Courtesy of www.staycanada.ca",$red);

	// Return the map image. We are using a PNG format as it gives better final image quality than a JPG
	// header("Content-Type: image/png");
	$path = "worldmap.jpg";
	// imagepng($im, $path, 9);
	imagejpeg($im, $path, 70);
	imagedestroy($im);

}


// Now we convert the long/lat coordinates into screen coordinates
function getlocationcoords($lat, $lon, $width, $height)
{  
    $x = (($lon + 180) * ($width / 360));
    $y = ((($lat * -1) + 90) * ($height / 180));
    return array("x"=>round($x),"y"=>round($y));
}




?>