<?php



$url = isset($_GET['url']) ? $_GET['url'] : null;
$callback = isset($_GET['callback']) ?$_GET['callback'] : null;
function getData($url) {
    $Context = stream_context_create(array(
                'http' => array(
                    'method' => 'GET',
                    'timeout' => 10, //That is in seconds
                    ),
                'https' => array(
                    'method' => 'GET',
                    'timeout' => 10, //That is in seconds
                    )                
                ));
    //$abc = file_get_contents($url , false, $Context);

    return file_get_contents($url , false, $Context);
}
header('Content-Type: application/javascript');


if ($url) {
    $img = getSslPage($url);    
    
    if ($callback) {
        $img = base64_encode($img);
        sleep(10);
       echo "window['$callback'] && $callback(\" $img \")";
    }else {
        //echo "data:image/jpeg;base64," . $img;
        echo $img;
    }
    
}else{
    echo "url not input";
}
function getSslPage($url) {
$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_REFERER, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
$result = curl_exec($ch);
curl_close($ch);
return $result;
}
