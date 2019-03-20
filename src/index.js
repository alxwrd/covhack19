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

NProgress.configure({
  parent: "#app",
  showSpinner: false,
  minimum: 0.0
})

// The number of classes we want to predict. In this example, we will be
// predicting 4 classes for up, down, left, and right.
const NUM_CLASSES = 3;

// A webcam class that generates Tensors from the images from the webcam.
const webcam = new Webcam(document.getElementById('webcam'));

var watching;


function main(data) {
  document.getElementById("start").style.display = "none";
  document.getElementById("train").style.display = "";
  let controllerDataset = new ControllerDataset(NUM_CLASSES);

  console.log(data)

  var label = 0;
  var key = Object.keys(data.Options)[label];
  console.log(key)

  document.getElementById("image").src = `images/${key}.png`
  document.getElementById("letter").innerHTML = key;


  async function trainLabel(label, iterations) {
    const timeout = async ms => new Promise(res => setTimeout(res, ms));

    for (let x = 0; x <= iterations; x++) {
      await timeout(1)
      NProgress.set(x / iterations)
      controllerDataset.addExample(webcam.capture(), label)
    }
  }

  let alreadyTraining = false;

  document.getElementById("train").addEventListener("click", async () => {
    console.log("training ...")

    if (alreadyTraining) {
      return;
    }
    alreadyTraining = true;
    await trainLabel(label, 50).then(() => {
      alreadyTraining = false;
    })

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
      document.getElementById("train").style.display = "none";
      console.log("training network")

      console.log("starting story ...")

      controllerDataset.train()

      typeWriterPromise(data.Scenario).then(() => {
        var submitTimeout = 0;
        var currentClassId;
        var lastClassId;

        watching = setInterval(() => {
          NProgress.set(submitTimeout / 50)
          let img = webcam.capture();

          controllerDataset.predict(img).then((result) => {
            let key = Object.keys(data.Options)[result];
            document.getElementById("image").src = `images/${key}.png`
            document.getElementById("letter").innerHTML = key;
            document.getElementById("choice").innerText = data.Options[key];
            lastClassId = currentClassId;
            currentClassId = result;
          });

          if (lastClassId === currentClassId) {
            submitTimeout++;
          } else {
            submitTimeout = 0;
          }

          if (submitTimeout > 50) {
            submit();
          }
        }, 100)
      })

      function submit() {
        clearInterval(watching);
        let img = webcam.capture();
        controllerDataset.predict(img).then((result) => {
          let key = Object.keys(data.Options)[result];
          typeWriter(data[key]);
          document.getElementById("start").style.display = "";
        });
      };
    }
  })
}


document.getElementById("start").addEventListener("click", async () => {
  reset();
  if (!webcam.active) {
    webcam.setup()
      .then(() => {
        document.getElementById("header").classList.add("header-hidden")
        document.getElementById("app").classList.add("header-hidden")
        start()
      })
      .catch((error) => {
        console.log(error)
      })
  } else {
    start()
  }

  function start() {
    fetch("options.json").then((response) => {
      return response.json()
    })
      .then((data) => {
        clearInterval(watching)
        let scenario = data[Math.floor(Math.random() * data.length)];

        main(scenario);
      })
  }
})


let typeWriterPromise = (text, pos) => {
  return new Promise((resolve) => {
    typeWriter(text, pos, resolve)
  })
}

function typeWriter(text, pos, resolve) {
  let speed = Math.floor(Math.random() * 100);

  if (!pos) {
    pos = 0;
  }

  if (pos === 0) {
    document.getElementById("scenario").innerHTML = "";
  }

  if (pos < text.length) {
    document.getElementById("scenario").innerHTML += text.charAt(pos);
    setTimeout(() => {
      pos++
      typeWriter(text, pos, resolve)
    }, speed);
  } else {
    if (resolve) { resolve() }
  }
}


function reset() {
  document.getElementById("choice").innerText = "";
  document.getElementById("scenario").innerText = "";

  clearEventListeners("train");
}


function clearEventListeners(elementId) {
  var old_element = document.getElementById(elementId);
  var new_element = old_element.cloneNode(true);
  old_element.parentNode.replaceChild(new_element, old_element);
}
