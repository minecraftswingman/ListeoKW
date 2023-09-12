let map;
let customMarker;
const MarkerID = new Map();
const MarkerPlaceID= new Map();



async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const { SearchBox } = await google.maps.importLibrary("places");
  const {PinElement} = await google.maps.importLibrary("marker")
  const {LatLngBounds} = await google.maps.importLibrary("core")
  const {LatLngAltitude} = await google.maps.importLibrary("core")  
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
  map = new google.maps.Map(document.getElementById('location-display'), {
    mapId: "fa5a33edaafd98f4",
    center: { lat: 29.3759, lng: 47.9774 },
    zoom: 10,
  });

  
  const kuwaitBounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(28.5244, 46.4679), 
    new google.maps.LatLng(30.1396, 48.0976) 
  );

  const input = document.getElementById("searchInput");
  const searchBox = new google.maps.places.SearchBox(input, {
    bounds: kuwaitBounds,
    componentRestrictions: { country: "KW" },
  });

  let markers = [];

  
  searchBox.addListener("places_changed", async () => {
    clearResultsContainer();
    const places = searchBox.getPlaces();
    markers.forEach((marker) => {
      marker.setMap(null);
    });
    markers.length = 0;
    if (places.length == 0) {
      return;
    }
  
    let userLocation;
    try {
      userLocation = await getUserGeolocation();
    } catch (error) {
      console.error("Error getting user geolocation:", error);
      userLocation = { lat: 29.3759, lng: 47.9774 }; 
    }
  
    const userInput = input.value; 
    const biasLocation = new google.maps.LatLng(userLocation.lat, userLocation.lng);
    
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(biasLocation);

    const request = {
      location: biasLocation,
      radius: 5000, 
      query: userInput, 
    };
    
   
    markers = [];

    map.fitBounds(bounds, { minZoom: 3 });

    map.setZoom(10);

    let infoWindows = [];
    function MarkerClick(marker, placeId) {
      infoWindows.forEach((infoWindow) => {
        infoWindow.close();
      });
     
      let infoWindow = new google.maps.InfoWindow();
      
      window.addEventListener('keydown', (event) => {
        if (event.keyCode === 27) {
          infoWindow.close();
        }
      });

      const request = {
        placeId: placeId,
        fields: [
          "name",
          "formatted_address",
          "photos",
          "formatted_phone_number",
          "website",
          "opening_hours",
          "rating",
          "reviews",
        ],
      };
    
      const service = new google.maps.places.PlacesService(map);
      service.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          let content = '<div info-window-content;">';

          if (place.photos && place.photos.length > 0) {
            content += `<h2 class="name">${place.name}</h2>`;
            content += `<p class="address">Address: ${place.formatted_address}</p>`;
          
            const photoUrl = place.photos[0].getUrl();
            
            
          
            content += `<div class="image-container"><img class="image" src="${photoUrl}" alt="${place.name}" style="max-width: 200px; max-height: 100px;"></div>`;
                    
            if (place.website) {
              content += `<hr>`
              content += `<a href="${place.website}" style='text-decoration:none;' >`;
              content += "<button class='web-btn'>Website</button>";
              content += `</a>`;
            }
          
            if (place.formatted_phone_number) {
              content += '<div class="phone-container">';
              content += "<br>"
              content += `<i class="fa-solid fa-phone"></i><p class="phone-number">${place.formatted_phone_number}</p>`;
              content += '</div>';
            }
          
          }
          if (place.rating) {
            content+= "<br>";
            content+= "<br>";
            content += '<div class="rating-container">';
  
            
            content += '<p class="rating">';
            content += `Rating: &nbsp;${place.rating}`;
            for (let i = 0; i < place.rating; i++) {
              content += '&nbsp<i class="fa fa-star"></i>';
            }
            
            content+= "</p>"
  
            content += '</div>';
          }
          if (place.reviews && place.reviews.length > 0) {
            content += "<div id='review'>"
            content += '<p style="font-weight:bold; color: whitesmoke; font-size: 20px; margin-right:10px;">Reviews:</p>';            
            place.reviews.forEach((review) => {
              if (review.text && review.text.trim().length > 0) {
                content += `<p class="review-item">${review.text}</p>`;
              }
              else {

              }
            });
            
            content += '</ul>';
            content += "</div>"
          }
    
          content += '</div>';
          infoWindow.setContent(content);
          
          infoWindow.open(map, marker);
    
          infoWindows.push(infoWindow);
        } else {
          console.error("Error fetching Place Details:", status);
        }
      });
    }
  
    markers.forEach((marker) => {
      marker.setMap(null);
  });
  markers.length = 0;
    const service = new google.maps.places.PlacesService(map);
    service.textSearch(request, (results, status) => {
      
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        results.forEach((place) => {
          if (!place.name.includes("ديوان")) {
          
            const marker = new AdvancedMarkerElement({
              map,
              position: place.geometry.location,
              content:new PinElement({
                background: "#3106b1",
                borderColor: "#ffffff",
                glyphColor: "#200ca6",
              }).element,
            });
 
      const infoWindow = new google.maps.InfoWindow();
      MarkerPlaceID.set(marker, place.place_id);
      marker.addListener("click", () => {  
        console.log(place.place_id);
        MarkerClick(marker, place.place_id);
        resultRowCLick(marker);
      });
    
            google.maps.event.addListener(map, 'click', function() {
              infoWindows.forEach(function(infoWindow) {
                infoWindow.close();
              });
            });
            markers.push(marker);
            
            addNewResultRow(place.name, place.formatted_address, marker);
          } 
        });
  
        console.log("Nearby search results:", results);
      } else {
        console.error("Error performing nearby search:", status);
      }
    });
    document.querySelector('.results').addEventListener('click', (event) => {
      const clickedRow = event.target.closest('.result-row');
      if (clickedRow) {
          let marker = MarkerID.get(clickedRow);
          let placeId = MarkerPlaceID.get(marker);
          MarkerClick(marker, placeId);
          resultRowCLick(marker);
  
        }
  });

    
  
    map.fitBounds(request.bounds);
  });
  document.getElementById("search-button").addEventListener("click", () => {
    searchBoxPlaces();
  });

 
  function searchBoxPlaces() {
    const input = document.getElementById("searchInput").value;

    if (!input) {
      return;
    }

    google.maps.event.trigger(searchBox, "places_changed");
  }

  const searchButton = document.getElementById("search-button");
  searchButton.style.backgroundColor = "#4211d4";
  searchButton.style.color = "white";
  searchButton.style.border = "none";
  searchButton.style.padding = "10px 15px";
  searchButton.style.borderRadius = "30px";
  searchButton.style.cursor = "pointer";
  searchButton.style.marginLeft = "210px";
  searchButton.style.marginBottom = "5px";
  searchButton.style.width = "60px";
  searchButton.style.height = "60px";

  const searchIcon = searchButton.querySelector("i");
  searchIcon.style.fontSize = "20px";
  searchIcon.style.marginRight = "0px";

 
}
document.addEventListener("DOMContentLoaded", function() {
  initMap();
});



function getUserGeolocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          resolve(userLocation);
        },
        (error) => {
          reject(error);
        }
      );
    } else {
      reject(new Error("Geolocation is not supported by this browser."));
    }
  });
}
function clearResultsContainer() {
  const resultsContainer = document.querySelector('.results');
  resultsContainer.innerHTML = '';
}

async function addNewResultRow(name, address, marker)  {
  const resultsContainer = document.querySelector('.results');

  const addressParts = address.split(',');
  if (addressParts.length > 1) {
    addressParts.shift();
  }

  const formatted_address = addressParts.join(','); 

  const newResultRow = document.createElement('div');
  newResultRow.classList.add('result-row');
  newResultRow.textContent = `${name}, ${formatted_address}`;

  resultsContainer.appendChild(newResultRow);

 
  MarkerID.set(newResultRow, marker);

}

function resultRowCLick(customMarker) {
    map.panTo(customMarker.position);
    for (let zoom = 0; zoom <= 14; zoom++) {
         map.setZoom(zoom);
      }
      
  }

