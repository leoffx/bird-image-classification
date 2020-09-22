const inputButton = document.getElementById('input');
const imageFrame = document.getElementById('image');
const imageDiv = document.getElementById('imageDiv');
const predictionFrame = document.getElementById('predictions');
let model, image;
let suggestedSpecies = [];

async function loadModels() {
  const MODEL_URL =
    'https://raw.githubusercontent.com/leoffx/tori-birds-identification/master/src/assets/tf/model.json';
  model = await tf.loadGraphModel(MODEL_URL);
  predictionFrame.innerText =
    'Model loaded! Please upload a brazilian bird picture.';
}

async function loadImage(input) {
  var reader = new FileReader();
  reader.readAsDataURL(input.files[0]);
  reader.onload = function (e) {
    imageFrame.src = e.target.result;
  };
}

imageFrame.onload = function (e) {
  predict().then((res) => {
    predictionFrame.innerText = '';
    const { values, indices } = tf.topk(res, 5);
    const indicesArray = indices.arraySync()[0];
    const valuesArray = values.arraySync()[0];
    indicesArray.forEach((index, i) => {
      const bird = birdDictionary[index];
      const suggestionData = {
        index,
        confidence: Math.floor(valuesArray[i] * 100),
        id: bird.id,
        name: bird.name,
        age: bird.age,
        sex: bird.sex,
      };
      if (suggestionData.confidence > 10) {
        birdName =
          suggestionData.name.charAt(0).toUpperCase() +
          suggestionData.name.slice(1);
        switch (suggestionData.sex) {
          case 'F':
            birdSex = 'Female';
            break;
          case 'M':
            birdSex = 'Male';
            break;
          default:
            birdSex = '';
        }
        switch (suggestionData.age) {
          case 'A':
            birdAge = 'Adult';
            break;
          case 'J':
            birdAge = 'Young';
            break;
          default:
            birdAge = '';
        }

        suggestedSpecies.push(suggestionData);
        var item = document.createElement('li');
        item.appendChild(
          document.createTextNode(
            `${birdName}, ${birdAge} ${birdSex} : ${suggestionData.confidence}%`
          )
        );
        predictionFrame.appendChild(item);
      }
    });
  });
};

async function predict() {
  while (!model) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  image = tf.browser
    .fromPixels(imageFrame)
    .resizeBilinear([224, 224])
    .asType('float32');
  const normalizedImage = image.div([255]).expandDims();
  prediction = await model.predict(normalizedImage);
  return prediction;
}

function loadJSON(callback) {
  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType('application/json');
  xobj.open(
    'GET',
    'https://raw.githubusercontent.com/leoffx/tori-birds-identification/master/src/assets/tf/mappingPredictionToObject.json',
    true
  );
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == '200') {
      callback(xobj.responseText);
    }
  };
  xobj.send(null);
}

function main() {
  loadModels();
  loadJSON((response) => {
    birdDictionary = JSON.parse(response);
  });
}
main();
