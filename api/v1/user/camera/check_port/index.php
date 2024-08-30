<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $host = $_POST['ip'];
    $port = $_POST['port'];

    if (filter_var($host, FILTER_VALIDATE_IP)) {
        $ip = $host;
    } else {
        $ip = gethostbyname($host);
        if ($ip === $host) {
            echo "Invalid URL or IP address.";
            exit;
        }
    }

    if (is_numeric($port)) {
        function isPortOpen($ip, $port, $timeout = 3) {
            $connection = @fsockopen($ip, $port, $errno, $errstr, $timeout);
            if ($connection) {
                fclose($connection);
                return true;
            } else
                return false;
        }

        if (isPortOpen($ip, $port))
            echo "Port $port on $host ($ip) is open.";
        else
            echo "Port $port on $host ($ip) is closed.";
    } else
        echo "Invalid port number.";
} else
    echo "Invalid request method.";

?>
