let savedData = localStorage.getItem("weatherData");

if (savedData) {
  let data = JSON.parse(savedData);

  //console.log(data);

  let dates = data.daily.time;
  let maxTemps = data.daily.temperature_2m_max;
  let minTemps = data.daily.temperature_2m_min;
  let wind = data.daily.wind_speed_10m_max;
  let rain = data.daily.precipitation_sum;
  let weatherC = data.daily.weather_code;
  let daylight = data.daily.daylight_duration;

  // now use them normally
  // console.log(weatherC);
  // console.log(daylight[2]);
  //console.log(daylight);
 
  //sunlight 
  let sunP = document.querySelector(".info-p3");
  
  let Shour = daylight[2] / 3600;
  let totalH = Number(Shour.toFixed(2));
  let hours = Math.floor(totalH);
  let mint = Math.round((totalH-hours) * 60);
  console.log(totalH);
  console.log(mint);
  sunP.textContent = `${hours}h ${mint}m`;

  //rain
  let rainP = document.querySelector(".info-p1");
  rainP.textContent = `${rain[2]}mm`;

  //wind
  let windP = document.querySelector(".info-p2");
  windP.textContent = `${wind[2]}km/h`;
  //change images according to weather of next days
  let fImg = document.querySelector(".temp-img");
  checkCode(weatherC[2], fImg);
  
  //slide
  let sImg = document.querySelectorAll(".s-img");
  let sTemp = document.querySelectorAll(".s-temp");
  let sDay = document.querySelectorAll(".s-day");

  sTemp[0].textContent = `${maxTemps[2]} / ${minTemps[2]}`;

    for(let i=0; i<sImg.length; i++){

        let code = weatherC[i+3];

        //update temprature
        sTemp[i+1].textContent = `${maxTemps[i+3]} / ${minTemps[i+3]}`;

        //update date
        sDay[i].textContent = dates[i+3].slice(5);
        //console.log(dates[0]);

        //change image
        checkCode(code, sImg[i]);
    }

    //change body color
    changeBodyC(weatherC[1]);

}

function checkCode(code, sImg){
  if (code === 0) {
    sImg.src = "images/sun.png";

  }else if (code === 1 || code === 2) {
    sImg.src = "images/partly-cloud.png";

  }else if (code === 3) {
    sImg.src = "images/clouds.png";

  }else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    sImg.src = "images/rainy.png";

  }else if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    sImg.src = "images/snowy.png";

  }else if (code >= 95) {
    sImg.src = "images/thunder.png";
  }
}


function changeBodyC(code){
    let BodyCol = document.querySelector("body");

    if (code === 0) {
      BodyCol.style.background = "linear-gradient(to right, #fff6d5, #ffe9a7)";

    }else if (code === 1 || code === 2) {
      BodyCol.style.background = "linear-gradient(to right, #dbeafe, #f0f9ff)";

    }else if (code === 3) {
      BodyCol.style.background = "linear-gradient(to right, #e3edf7, #f5f7fa)";

    }else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
      BodyCol.style.background = "linear-gradient(to right, #e0e7ff, #f3f4ff)";

    }else if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
      BodyCol.style.background = "linear-gradient(to right, #f1f5f9, #e0f2fe)";

    }else if (code >= 95) {
      BodyCol.style.background = "linear-gradient(to right, #eef1f5, #dbe4ee)";

    }
}
