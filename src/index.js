/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import 'babel-polyfill';

import { ControllerDataset } from './controller_dataset';
import { Webcam } from './webcam';

// The number of classes we want to predict. In this example, we will be
// predicting 4 classes for up, down, left, and right.
const NUM_CLASSES = 3;

// A webcam class that generates Tensors from the images from the webcam.
const webcam = new Webcam(document.getElementById('webcam'));


async function init() {
  try {
    webcam.setup()
  } catch (e) {
    document.getElementById('no-webcam').style.display = 'block';
  }
}


async function loop(data) {
  let controllerDataset = new ControllerDataset(NUM_CLASSES);

  console.log(data)

  var label = 0;
  var key = Object.keys(data.Options)[label];
  console.log(key)

  document.getElementById("image").src = `images/${key}.png`
  document.getElementById("letter").innerHTML = key;



  document.getElementById("train").addEventListener("click", () => {
    console.log("training ...")
    for (let x = 1; x < 30; x++) {
      controllerDataset.addExample(webcam.capture(), label)
      console.log(`training on label ${label}`)
    }

    console.log("moving on to next image ...")

    if (label < 2) {
      label++;
      var key = Object.keys(data.Options)[label];
      console.log(key)
      document.getElementById("image").src = `images/${key}.png`
      document.getElementById("letter").innerHTML = key;
      return;
    }

    if (label == 2) {
      console.log("training network")

      console.log("starting story ...")


      typeWriter(data.Scenario);


      // can't figure out why it's predicitng before training
      controllerDataset.train()

      function submit() {
        let img = webcam.capture();
        controllerDataset.predict(img).then(function (result) {
          let key = Object.keys(data.Options)[result];
          document.getElementById("image").src = `images/${key}.png`
          document.getElementById("letter").innerHTML = key;
          document.getElementById("choice").innerText = data.Options[key];
        });
      }

      setInterval(() => {
        submit()
      }, 500)

      document.getElementById("submit").addEventListener("click", () => {
        let img = webcam.capture();
        controllerDataset.predict(img).then(function (result) {
          let key = Object.keys(data.Options)[result];

          typeWriter(data[key]);
        });

      })
    }
  })
}


document.getElementById("start").addEventListener("click", () => {
  fetch("options.json").then((response) => {
    return response.json()
  })
    .then((data) => {
      let scenario = data[Math.floor(Math.random() * data.length)];

      loop(scenario);

    })
})


function typeWriter(text, pos) {
  let speed = Math.floor(Math.random() * 200);

  if (!pos) {
    pos = 0;
  }

  if (pos === 0) {
    document.getElementById("scenario").innerHTML = "";
  }

  if (pos < text.length) {
    document.getElementById("scenario").innerHTML += text.charAt(pos);
    pos++;
    setTimeout(() => {
      typeWriter(text, pos)
    }, speed);
  }
}

init();
