<?php
    /* 
    Inputs:
    1) criteria:  A string to match countries on
    2) searchType: 
        - "code":       Search by alpha code. Criteria should be either 2 or 3 characters long.
        - "fullName":   Search by an exact match. Criteria should either match the country name or alternate spellings (sometimes alpha codes, or aliases)
        - "name":       Search by partial match of either of the other search types.

    Responses from this API will be:
    1) JSON object with status code and message (immediately exit).
    2) Array of responses as specified by REST Countries API. An empty array indicates the search criteria matched nothing.    
    3) Empty. Assumption is that a bad actor called into our API.
    */

    $criteria = $_GET["criteria"]; //REST Countries API should sanitize this, so we won't
    $search_type = $_GET["searchType"];
    $url = "";
    $filter = '?fields=name;alpha2Code;alpha3Code;flag;region;subregion;population;languages'; //Reduce response volume by filtering to criteria we actually care about displaying


    //Some safety checks that shouldn't happen. We will quit silently if they fail.
    //Theoretically we could send something back with details, but right now, I am the only consumer and should not call like this 
    if ($criteria == "" || $search_type == "") exit;  
    if (!ctype_alpha($criteria)) exit;
     
    switch($search_type)
    {
        case "code":
            //A successful search from this route returns a single result instead of an array so we need to wrap in an array for our own consistency
            $url = 'https://restcountries.eu/rest/v2/alpha/'.$criteria.$filter;
            $decoded = makeApiCall($url); 
            echo json_encode(array($decoded)); 
            break;
        case "fullName":
            //Appending the filter here actually reveals a bug in their API. It will reroute it to partial name search. Sad.
            //We assume the response will always yield 0 or 1 results so no need to sort.
            $url = 'https://restcountries.eu/rest/v2/name/'.$criteria.'?fullText=true'; 
            $decoded = makeApiCall($url); 
            echo json_encode($decoded);
            break;
        case "name":
            $url = 'https://restcountries.eu/rest/v2/name/'.$criteria.$filter;
            $decoded = makeApiCall($url); 
            usort($decoded, "descPopSortFunc");
            echo json_encode($decoded);
            break;
        default:
            //Once again, since I'm the only consumer and will never call like this, just do nothing
            break;
    }


/*
Takes in a formatted URL for the API call and attempts to retrieve a response. 
On a successful retrieval, returns a decoded response. 
On a failure, will echo the error response and immediately exit
*/
function makeApiCall($url)
{
    $curl = curl_init($url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    $curl_response = curl_exec($curl);
    $decoded = json_decode($curl_response);
    curl_close($curl);

    if ($curl_response === false) 
    {
        $info = curl_getinfo($curl);
        $response = new stdObject();
        /*Treat as poorly formatted request
        Not sure if this is sufficient, but I'm still new to this area and am uncertain what errors would actually get us here 
        A problem this introduces is that I'm trashing whatever error dump the original API would have returned
        */
        $response->status = 400; 
        $response->message = "Bad Request"; 
        echo json_encode($response);  //Here, we send back a JSON encoded value with status and message
        exit;
    }
    else
    {       
        if (isset($decoded->status))
        {
            echo $curl_response; //Pass to client as JSON with status and message
            exit;
        }
        return $decoded;              
    }   
    
}


//Sorting function for an array of results which will sort in descending order by population
function descPopSortFunc($a, $b)
{
    $a_pop = $a->population;
    $b_pop = $b->population;

    if ($a_pop == $b_pop) {
        return 0;
    }
    return ($a_pop > $b_pop) ? -1 : 1;

}


