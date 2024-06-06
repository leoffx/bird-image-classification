async function main() {
  const predictionFrame = document.getElementById("predictions");
  const inputFrame = document.getElementById("input");
  const imageFrame = document.getElementById("image");

  const [model, mapping] = await Promise.all([loadModel(), loadMapping()]);
  predictionFrame.innerText =
    "Model loaded! Please upload a brazilian bird picture.";

  inputFrame.addEventListener("change", (event) => loadImage(event));
  imageFrame.addEventListener("load", () => {
    predictionFrame.innerText = "";
    renderPredictions(model, mapping, imageFrame);
  });
}

async function loadModel() {
  const MODEL_URL =
    "https://raw.githubusercontent.com/leoffx/tori-birds-identification/master/src/assets/tf/model.json";
  return tf.loadGraphModel(MODEL_URL);
}
async function loadMapping() {
  const MAPPING_URL =
    "https://raw.githubusercontent.com/leoffx/tori-birds-identification/master/src/assets/tf/mappingPredictionToObject.json";
  const response = await fetch(MAPPING_URL);
  return response.json();
}

async function loadImage(event) {
  const reader = new FileReader();
  reader.readAsDataURL(event.target.files[0]);
  reader.addEventListener("load", () => {
    const imageFrame = document.getElementById("image");
    imageFrame.src = reader.result;
  });
}

async function renderPredictions(model, mapping, imageFrame) {
  const res = await predict(model, imageFrame);
  const { values, indices } = tf.topk(res, 5);
  const indicesArray = indices.arraySync()[0];
  const valuesArray = values.arraySync()[0];
  indicesArray.forEach((index, i) => {
    const bird = mapping[index];
    const suggestionData = {
      index,
      confidence: Math.floor(valuesArray[i] * 100),
      id: bird.id,
      name: bird.name,
      age: bird.age,
      sex: bird.sex,
    };
    birdName =
      suggestionData.name.charAt(0).toUpperCase() +
      suggestionData.name.slice(1);
    switch (suggestionData.sex) {
      case "F":
        birdSex = "Female";
        break;
      case "M":
        birdSex = "Male";
        break;
      default:
        birdSex = "";
    }
    switch (suggestionData.age) {
      case "A":
        birdAge = "Adult";
        break;
      case "J":
        birdAge = "Young";
        break;
      default:
        birdAge = "";
    }

    const item = document.createElement("li");
    item.textContent = `${birdName}, ${birdAge} ${birdSex} : ${suggestionData.confidence}%`;
    const predictionFrame = document.getElementById("predictions");
    predictionFrame.appendChild(item);
  });
}

async function predict(model, imageFrame) {
  image = tf.browser
    .fromPixels(imageFrame)
    .resizeBilinear([224, 224])
    .asType("float32");
  const normalizedImage = image.div([255]).expandDims();
  return model.predict(normalizedImage);
}

main();
