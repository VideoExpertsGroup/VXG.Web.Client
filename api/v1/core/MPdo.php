<?php
include_once('MCore.php');

/**
 * Wrap for MCore::$core->pdo->fetchAll method
 */
function fetchAll($sql, $args=array(), $errcode=MCore::DEFAULT_PDO_ERROR_HTTP_CODE, $errmsg=MCore::DEFAULT_PDO_ERROR_MESSAGE){
    if (!(MCore::$core->pdo instanceof MPdo)) return;
    return MCore::$core->pdo->fetchAll($sql, $args, $errcode, $errmsg);
}

/**
 * Wrap for MCore::$core->pdo->fetchRow method
 */
function fetchRow($sql, $args=array(), $errcode=MCore::DEFAULT_PDO_ERROR_HTTP_CODE, $errmsg=MCore::DEFAULT_PDO_ERROR_MESSAGE){
    if (!(MCore::$core->pdo instanceof MPdo)) return;
    return MCore::$core->pdo->fetchRow($sql, $args, $errcode, $errmsg);
}

/**
 * Wrap for MCore::$core->pdo->fetchOne method
 */
function fetchOne($sql, $args=array(), $errcode=MCore::DEFAULT_PDO_ERROR_HTTP_CODE, $errmsg=MCore::DEFAULT_PDO_ERROR_MESSAGE){
    if (!(MCore::$core->pdo instanceof MPdo)) return;
    return MCore::$core->pdo->fetchOne($sql, $args, $errcode, $errmsg);
}

/**
 * Wrap for MCore::$core->pdo->query method
 */
function query($sql, $args=array(), $errcode=MCore::DEFAULT_PDO_ERROR_HTTP_CODE, $errmsg=MCore::DEFAULT_PDO_ERROR_MESSAGE){
    if (!(MCore::$core->pdo instanceof MPdo)) return;
    return MCore::$core->pdo->query($sql, $args, $errcode, $errmsg);
}

/**
 * Extended PDO class for VXG project
 * 
 * Sample of use:
 * 
 * include_once('MCore.php');
 * 
 * MCore::init();
 * 
 * print fetchOne('SELECT sett_name FROM settings where name=? limit 1',['user']); // print the one value
 * 
 * $val = fetchRow('SELECT * FROM settings limit 1'); // return one row
 * 
 * $all = fetchAll('SELECT * FROM settings'); // return all rows
 * 
 * $id = query('INSERT INTO "user" (name) VALUES(?)',['user']); // returns the id of the inserted row
 */
class MPdo extends PDO{

    /**
     * Fetch one row from results for sql request
     *
     * @param string  $sql               SQL request string
     * @param array   $args              Array of arguments
     * @param integer $errcode           Http code, returned on error
     * @param string  $errmsg            Error message,  returned on error
     * @param bool    $exceptions_enable true for exception. false for terminate on error
     * @return array|bool Array with result or false
     */
    public function fetchRow($sql, $args=array(), $errcode=MCore::DEFAULT_PDO_ERROR_HTTP_CODE, $errmsg=MCore::DEFAULT_PDO_ERROR_MESSAGE, $exceptions_enable=false){
        $r = fetchAll($sql, $args, $errcode, $errmsg, $exceptions_enable);
        if ($r===false || !isset($r[0]))
            return false;
        return $r[0];
    }

    /**
     * Fetch all results for sql request
     *
     * @param string  $sql               SQL request string
     * @param array   $args              Array of arguments
     * @param integer $errcode           Http code, returned on error
     * @param string  $errmsg            Error message,  returned on error
     * @param bool    $exceptions_enable true for exception. false for terminate on error
     * @return array|bool Array with result or false
     */
    public function fetchAll($sql, $args=array(), $errcode=MCore::DEFAULT_PDO_ERROR_HTTP_CODE, $errmsg=MCore::DEFAULT_PDO_ERROR_MESSAGE, $exceptions_enable=false){
        if (!is_array($args)){
            $errcode = 0+$args;
            $args = array();
        }
        try{
            $stmt = $this->prepare($sql);
            if(!$stmt->execute($args))
                if ($exceptions_enable)
                    throw new Exception($stmt->errorInfo()[2],$errcode);
                else
                    MCore::$core->error($errcode, $errmsg.' '.$stmt->errorInfo()[2]);
            $ret = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(Exception $e){
            if (!MCore::isProduction() || $exceptions_enable) throw $e;
            MCore::$core->error($errcode, $errmsg.' '.$e->getMessage());
            return false;
        }
        return $ret;
    }

    /**
     * Fetch one field from SQL request
     *
     * @param string  $sql               SQL request string
     * @param array   $errcode           Array of arguments
     * @param integer $errcode           Http code, returned on error
     * @param string  $errmsg            Error message,  returned on error
     * @param bool    $exceptions_enable true for exception. false for terminate on error
     * @return string|bool String with result or false
     */
    public function fetchOne($sql, $args=array(), $errcode=MCore::DEFAULT_PDO_ERROR_HTTP_CODE, $errmsg=MCore::DEFAULT_PDO_ERROR_MESSAGE, $exceptions_enable=false){
        if (!is_array($args)){
            $errcode = 0+$args;
            $args = array();
        }
        try{
            $stmt = $this->prepare($sql);
            if(!$stmt->execute($args))
                if ($exceptions_enable)
                    throw new Exception($stmt->errorInfo()[2],$errcode);
                else
                    MCore::$core->error($errcode, $errmsg.' '.$stmt->errorInfo()[2]);
            $ret = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(Exception $e){
            if (!MCore::isProduction() || $exceptions_enable) throw $e;
            MCore::$core->error($errcode, $errmsg.' '.$e->getMessage());
            return false;
        }
        if (!$ret)
            return NULL;
        $ret = is_array($ret) ? $ret[0] : NULL;
        if (is_array($ret)) 
            foreach($ret as $v)
                return $v;
        return NULL;
    }

    /**
     * Execute SQL request
     *
     * @param string  $sql               SQL request string
     * @param array   $args              Array of arguments
     * @param integer $errcode           Http code, returned on error
     * @param string  $errmsg            Error message,  returned on error
     * @param bool    $exceptions_enable true for exception. false for terminate on error
     * @return integer|bool return last insert id , if insert operation or false
     */
    public function query($sql, $args=array(), $errcode=MCore::DEFAULT_PDO_ERROR_HTTP_CODE, $errmsg=MCore::DEFAULT_PDO_ERROR_MESSAGE, $exceptions_enable=false){
        try{
            $stmt = $this->prepare($sql);
            if(!$stmt->execute($args))
                if ($exceptions_enable)
                    throw new Exception($stmt->errorInfo()[2],$errcode);
                else
                    MCore::$core->error($errcode, $errmsg.' '.$stmt->errorInfo()[2]);
        } catch(Exception $e){
            if (!MCore::isProduction() || $exceptions_enable) throw $e;
            MCore::$core->error($errcode, $errmsg.' '.$e->getMessage());
            return false;
        }
        $a = (int)PDO::lastInsertId();
        return $a;
    }
}
