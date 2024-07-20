function calculatePercentile(tensor, percentile) {
  if (percentile < 0 || percentile > 100) {
    throw new Error("Percentile must be between 0 and 100");
  }

  // Sort the tensor
  const sorted = tensor.sort();

  // Determine the index for the desired percentile
  const index = tf
    .scalar(percentile / 100)
    .mul(tf.scalar(sorted.size - 1))
    .dataSync()[0];

  // Get the value at the index (linear interpolation if necessary)
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  if (lowerIndex === upperIndex) {
    return sorted.gather(lowerIndex).dataSync()[0];
  } else {
    const lowerValue = sorted.gather(lowerIndex).dataSync()[0];
    const upperValue = sorted.gather(upperIndex).dataSync()[0];
    const weight = index - lowerIndex;
    return lowerValue * (1 - weight) + upperValue * weight;
  }
}

// Function to clip a tensor at given lower and upper percentile values
function clipTensor(tensor, lowerPercentile, upperPercentile) {
  const lowerValue = calculatePercentile(tensor, lowerPercentile);
  const upperValue = calculatePercentile(tensor, upperPercentile);
  return tensor.clipByValue(lowerValue, upperValue);
}

function minMaxScaler(tensor, minRange = 0, maxRange = 1) {
  const minTensor = tensor.min();
  const maxTensor = tensor.max();
  const scaledTensor = tensor
    .sub(minTensor)
    .div(maxTensor.sub(minTensor))
    .mul(tf.scalar(maxRange - minRange))
    .add(tf.scalar(minRange));
  return scaledTensor;
}

function rgbToGrayscale(tensor) {
  // Check if the tensor has the correct shape
  if (tensor.shape.length !== 3 || tensor.shape[2] !== 3) {
    throw new Error("Input tensor must have shape [height, width, 3]");
  }

  // Extract the R, G, B components
  const [red, green, blue] = tf.split(tensor, 3, 2);

  // Apply the grayscale conversion formula
  const grayscale = red.mul(0.299).add(green.mul(0.587)).add(blue.mul(0.114));

  // Reshape the grayscale tensor to have shape [height, width, 1]
  return grayscale;
}

function preProcessingImage(project_name) {
  let tensor = undefined;
  switch (project_name) {
    case "covid":
      // Resize ảnh
      tensor = tf.browser
        .fromPixels(raw_image)
        .resizeNearestNeighbor(getImageSize())
        .toFloat();
      // Dùng percentile min 2% max 98% để loại bỏ giá trị ngoại lai 2 đầu
      //tensor = clipTensor(tensor, 2, 98);
      // MinMax Scaler
      tensor = minMaxScaler(tensor);
      // Chuyển ảnh về dạng grayscale
      tensor = rgbToGrayscale(tensor);
      // Mở rộng chiều của mảng
      tensor = tensor.expandDims(0);
      break;
    default:
      break;
  }
  console.log(tensor.shape);
  return tensor;
}

async function beginPred() {
  // Tải mô hình
  await loadModel();
  // Tiền xử lý ảnh đầu vào
  const tensor = await preProcessingImage(project.name);
  // Bắt đầu dự đoán & xuất kết quả
  const prediction = await model.predict(tensor);
}

$(document).ready(function () {
  // Nếu có hành động upload ảnh thì thực thi loadImage
  $("#inFile").on("change", loadImage);

  // Nếu có hành động nhấn vào nút dự đoán thì bắt đầu dự đoán
  $("#btnPred").on("click", beginPred);
});
