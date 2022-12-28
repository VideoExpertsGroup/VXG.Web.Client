<?php

/**
 * Class for async working with the 'settings' table
 * 
 * Example of use:
 * 
 * include_once('MCore.php');
 * 
 * MCore::init();
 * 
 * $var = MCore::$core->settings['var']; // to read settings data
 * 
 * MCore::$core->settings['var'] = 123;  // to set parameter by name
 */
class MSetings implements ArrayAccess {
    public $settings;
    public $settings_types;

    function __construct($db_conn){
        $this->conn = $db_conn;
    }

    public function offsetGet($offset) {
        $this->prepareSettings();
        return isset($this->settings[$offset]) ? $this->settings[$offset] : null;
    }

    public function offsetSet($offset, $value) {
        $this->prepareSettings();
        if ($offset === null) {
            $this->settings[] = $value;
        } else {
            if (isset($this->settings[$offset]))
                query('UPDATE settings SET "sett_value"=? WHERE "sett_name"=?',[$value,$offset]);
            else
                query('INSERT INTO settings ("sett_name","sett_type", "sett_value") VALUES (?,?,?)',[$offset,(is_numeric($value) ? 'number':'string'),$value]);
            $this->settings[$offset] = $value;
        }
    }

    public function offsetExists($offset) {
        $this->prepareSettings();
        return isset($this->settings[$offset]);
    }

    public function offsetUnset($offset) {
        $this->prepareSettings();
        unset($this->settings[$offset]);
    }

    public function prepareSettings(){

        if (is_array($this->settings)) return $this->settings;
        $data = fetchAll('SELECT * FROM settings');
        $this->settings = array();
        $this->settings_types = array();
        foreach($data as $v) {
            $this->settings[$v['sett_name']]=$v['sett_value'];
            $this->settings_types[$v['sett_name']]=$v['sett_type'];
        }
        unset($data);
    }
}
