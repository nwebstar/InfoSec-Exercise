const SearchTypes = {
    Name: "name",
    FullName: "fullName",
    AlphaCode: "code"
}

//Attempts to search for results based on entered criteria and search type
function trySearch()
{
    const criteria = document.getElementById("criteriaInp").value.trim();
    const searchType = document.getElementById("searchTypeSel").value;

    if (!validateCriteria(criteria,searchType)) return;

    $.ajax({
        url : 'api/index.php',
        type : 'GET',
        data: {criteria:criteria, searchType: searchType},
        success : function (response) {
            handleResponse(response);
        },
        error: function (request) {
            //Honestly, I'm still a little unfamiliar with how AJAX could fail at this point so I'm not sure what to do here
            alert(JSON.stringify(request));
        }
    })
}

/*Listens to key events when you type in the search criteria box. 
Will initiate a search if enter is pressed*/
function criteriaInputKeyPressed(event)
{
    if (event.keyCode === 13)
    {
        trySearch();
        document.getElementById("searchBtn").focus();
    }
}

/*Checks to see if the criteria is well formed. Will show user an alert if the criteria is bad.
Returns true if criteria seems valid, false if it definitely won't work.
*/
function validateCriteria(criteria, searchType)
{
    if (criteria == "") 
    {
        alert("Please enter some search criteria");
        return false;
    }
    
    if (!criteria.match(/^[A-Za-z]+$/)) //Look for letters only
    {
        alert("Numbers and special characters are not allowed in a search");
        return false;
    }

    //Alpha codes are all exactly 2 or 3 characters long
    if (searchType == SearchTypes.AlphaCode && 
        !(criteria.length ===2 || criteria.length ===3))
    {
        alert("Alpha codes searches must be either 2 or 3 characters");
        return false;
    }

    return true;

}

/*
Handles the response from the call to 'api/index.php'
*/
function handleResponse(responseString)
{
    response = JSON.parse(responseString);
    
    if(response && response.status) //Error in response
    {
        if (response.status == 404) //Nothing returned
        {
            renderNoResults();
        }
        else
        {
            //Don't update display, but alert user
            alert("Unable to complete search:\n" + responseString);
        }
    }
    else //Normal display
    {
        //response.sort((a,b) => b.population - a.population); This sorts in descending order on the client, but specs said do it on the server. My preference would have been to do it here
        renderResults(response);
    }    
}

//Tells the page to display the "No results" view
function renderNoResults()
{
    resetDisplay();
    const displayDiv = document.getElementById("displayDiv");
    displayDiv.append("No countries matched your criteria. Try again.")
}

/*Tells the page to display the results of a search. 
Takes in an array of results from the REST Countries API
*/
function renderResults(results)
{
    resetDisplay();

    const displayDiv = document.getElementById("displayDiv");
    displayDiv.append(buildResultsTable(results));
    displayDiv.append(document.createElement("br"));
    displayDiv.append(buildSummaryTable(results));
}

//Returns the "table" HTML element of our results
//Takes in parsed JSON results
function buildResultsTable(results)
{
    const table = document.createElement('table');
    
    table.append(buildResultTableHeader());
    table.append(buildResultTableBody(results));

    return table;
}

//Returns the "thead" HTML element of the results table 
function buildResultTableHeader()
{
    const thead = document.createElement('thead');
    const tHeadRow = document.createElement("tr");

    const headerTitles = ["Full name", "Alpha Code 2", "Alpha Code 3", "Flag", "Region", "Subregion", "Population", "Languages"]; //This could be more easily internationalized this way

    for (let i = 0; i < headerTitles.length; i++)
    {
        const th = document.createElement("th");
        th.innerText = headerTitles[i];
        tHeadRow.append(th);
    }

    thead.append(tHeadRow);
    
    return thead;
}

//Returns the "tbody" HTML element
//Takes in parsed JSON results
function buildResultTableBody(results)
{
    const tbody = document.createElement('tbody');
    for (let i = 0; i < results.length; i++)
    {
        tbody.append(buildResultRow(results[i]));
    }
    return tbody;
}

//Returns a result "tr" HTML element
//Takes a single result from the parsed JSON of our API
function buildResultRow(result) {
   
   const newRow = document.createElement("tr");

   
   newRow.append(buildTextTd(result.name));

   newRow.append(buildTextTd(result.alpha2Code));

   newRow.append(buildTextTd(result.alpha3Code));

   const tdFlag = document.createElement("td");
   tdFlag.append(buildFlagImg(result));
   newRow.append(tdFlag);

   newRow.append(buildTextTd(result.region));

   newRow.append(buildTextTd(result.subregion));

   newRow.append(buildTextTd(result.population));

   const tdLanguages = document.createElement("td");
   tdLanguages.append(buildLanguageList(result.languages));
   newRow.append(tdLanguages);

   return newRow;
}

//Returns a "td" HTML element with simple text
function buildTextTd(text)
{
    const td = document.createElement("td");
    td.innerText = text;
    return td;
}

//Returns a "ul" HTML element based on the languages of a result
function buildLanguageList(languages)
{
    const list = document.createElement("ul");
    for (let i = 0; i< languages.length; i++)
    {
        const item = document.createElement("li");
        item.innerText = languages[i]["name"];
        list.append(item);
    }

    return list;
}

//Returns a "img" HTML element based on the flag url of a result
function buildFlagImg(result)
{
    const flagImg = document.createElement("img");
    flagImg.src = result.flag;
    flagImg.height = 24;
    flagImg.width = 40;

    return flagImg;
}

//Returns the "table" HTML element of our summary of results
//Takes in parsed JSON results
function buildSummaryTable(results)
{
    const table = document.createElement('table');
    
    table.append(buildSummaryTableHeader());
    table.append(buildSummaryTableBody(results));

    return table;
}

//Returns the "thead" HTML element of the summary table 
function buildSummaryTableHeader()
{
    const thead = document.createElement('thead');
    const tHeadRow = document.createElement("tr");

    const headerTitles = ["Total", "Regions", "Sub Regions"]; //This could be more easily internationalized this way

    for (let i = 0; i < headerTitles.length; i++)
    {
        const th = document.createElement("th");
        th.innerText = headerTitles[i];
        tHeadRow.append(th);
    }

    thead.append(tHeadRow);
    
    return thead;
}

/*Returns the "tbody" HTML element of the summary table
Takes in parsed JSON results
*/
function buildSummaryTableBody(results)
{
    [total, regions, subregions] = calculateSummaryValues(results);

    const tbody = document.createElement('tbody');
    const row = document.createElement("tr");

    row.append(buildTextTd(total));

    const tdRegions = document.createElement("td");
    tdRegions.append(buildListFromMap(regions));
    row.append(tdRegions);

    const tdSubregions = document.createElement("td");
    tdSubregions.append(buildListFromMap(subregions));
    row.append(tdSubregions);

    tbody.append(row);

    return tbody;
}

//Calculate and return the values needed for the summary at the bottom of the page
//Returns the total countries and dictionaries of regions and subregions where the value is the number of times they appeared in results
function calculateSummaryValues(results)
{
    const regionMap = new Map();
    const subregionMap = new Map();

    for (let i = 0; i < results.length; i++)
    {
        incrementValInMap(regionMap, results[i].region);
        incrementValInMap(subregionMap, results[i].subregion);
    }

    return [results.length, regionMap, subregionMap];
}

//Increments the count of a value in a map. If value hasn't been added yet, will be set to 1
function incrementValInMap(map, value)
{
    if (map.has(value))
    {
        map.set(value, map.get(value) + 1);
    }
    else
    {
        map.set(value, 1);
    }
}

//Build a "ul" HTML element from an map of values
function buildListFromMap(map)
{
    const list = document.createElement("ul");
    map.forEach((value, key) => {
        const item = document.createElement("li");
        item.innerText = key + " (" + value + ")";
        list.append(item);
    })
    return list;

}

//Clear display div of all contents
function resetDisplay() 
{
    const resultsDiv = document.getElementById("displayDiv");
    resultsDiv.innerHTML = ""; //Reset completely
}


