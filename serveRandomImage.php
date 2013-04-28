<?php

// ini_set('display_errors', '1');
// error_reporting(E_ERROR | E_WARNING | E_PARSE);

// random queries from http://www.warpconduit.net/2011/03/23/selecting-a-random-record-using-mysql-benchmark-results/

// connect to database (MySQL and PostgreSQL if want the 'hints' functionality to work)
include ('dbconnect.php');


// if an id is set, return photo and metadata for that picture. otherwise, serve a random pic and its metadata.
if ( isset($_GET['id']) ) {
    
    // called with, for instance, http://twis.st/bluemarble/serveRandomImage.php?id=174
    $result = mysql_query( "SELECT id, width, height, filesize, cldp as cloudpercentage, lat, lon, geon, feat, url, description as mission, start as mission_start, end as mission_end FROM images LEFT JOIN missions ON images.mission = missions.mission WHERE id = " . mysql_real_escape_string($_GET['id']) );
    
    $image = mysql_fetch_assoc($result);
    
    // prepare a hint for the player: continent or Northern of Southern hemisphere
    if (is_numeric($image['lat'])) { $image['hint'] = prepareHint($image); }
    
    $image['info'] = prepareInfo($image);
    
    
} elseif ( isset($_GET['drie']) ) {
    
    // return info for three random pictures
    for ($i=0; $i<3; $i++) {
        $result = mysql_query("SELECT t.id, width, height, filesize, cldp as cloudpercentage, lat, lon, geon, feat, url, description as mission, start as mission_start, end as mission_end FROM images AS t JOIN (SELECT ROUND(RAND() * (SELECT MAX(id) FROM images)) AS id) AS x LEFT JOIN missions ON t.mission = missions.mission WHERE t.id >= x.id LIMIT 1");
        $image[] = mysql_fetch_assoc($result);
    }


} else {
    
    // find random image
    $result = mysql_query( "SELECT t.id, width, height, filesize, cldp as cloudpercentage, lat, lon, geon, feat, url, description as mission, start as mission_start, end as mission_end FROM images AS t JOIN (SELECT ROUND(RAND() * (SELECT MAX(id) FROM images)) AS id) AS x LEFT JOIN missions ON t.mission = missions.mission WHERE t.id >= x.id LIMIT 1");
    $image = mysql_fetch_assoc($result);
    
    $image['info'] = prepareInfo($image);
    
    // prepare a hint for the player: continent or Northern of Southern hemisphere
    if (isset($dbconn)) {
        if (is_numeric($image['lat'])) { $image['hint'] = prepareHint($image, $dbconn); }
    }

}



// create json object with image link and metadata
echo json_encode($image);



function prepareInfo($image) {
    
    $launchdate = new DateTime($image['mission_start']);
    
    $features = ucwords(strtolower($image['feat'])) . ", " . ucwords(strtolower($image['geon']));
    
    return "This photo was taken during space mission " . $image['mission'] . ", which was launched " . $launchdate->format('j F Y') . ". Features: " . $features . ".";
    
}

function prepareHint($image, $dbconn) {
    
    if ( is_numeric($image['lat']) && is_numeric($image['lon'])) {
        return getContinentTimezone($image['lat'], $image['lon'], $dbconn);
    }

    if ( $image['hint'] == null && is_numeric($image['lat'])) {
        if ( $image['lat'] < 90 ) { return "N"; }
        if ( $image['lat'] >= 90 ) { return "Z"; }
    }
    
}

function getContinentTimezone($lat, $lon, $dbconn) {
    
    // FOR POINTS THAT WERE NOT IN TIMEZONES: select nearest timezone 
    $query = "SELECT gid, tzid, ST_distance(the_geom, ST_GeomFromText('POINT(" . $lon . " " . $lat . ")')) as dist FROM tz_world_mp WHERE ST_DWithin(the_geom, ST_GeomFromText('POINT(" . $lon . " " . $lat . ")'), 10) order by dist limit 1";
    
    $resultTZ = pg_query($query) or die('Query failed: ' . pg_last_error());
    
    $tz = pg_fetch_array($resultTZ, null, PGSQL_ASSOC);
    
    // Free resultset
    pg_free_result($resultTZ);
    
    $timezone = explode('/', $tz["tzid"]);

    pg_close($dbconn);
    
    // Olsen area's: Africa, America, Antarctica, Arctic, Asia, Atlantic, Australia, Europe, Indian, and Pacific.
    // we want only the inhabited continents
    if ( ! in_array($timezone[0],array('Africa', 'America', 'Asia', 'Australia', 'Europe')) ) {
        return null;
    } else {
        return $timezone[0];
    }


}


?>