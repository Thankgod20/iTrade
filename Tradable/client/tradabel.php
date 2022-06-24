<?php
   $filename = __DIR__.DIRECTORY_SEPARATOR."text.json";
   $json = $_POST['json'];
   $data = json_decode($json, TRUE);

  // if(is_null($json) == false){
      //file_put_contents($filename, "$json \n", FILE_APPEND);
     // foreach ($data as $name => $value) {
        //file_put_contents($filename, "$name -> $value  \t", FILE_APPEND);
     // }
     // file_put_contents($filename, "\n", FILE_APPEND);
       $f=fopen("proxy_unconfirm.json",'w');
        fwrite($f,"$json");
        fclose($f); 
     // }
  // }

   $myFile = "proxy_unconfirm.json";
   $fh = fopen($myFile, 'r');
   $theData = fread($fh,  filesize($myFile));
   fclose($fh);
    echo $theData;
   ?>