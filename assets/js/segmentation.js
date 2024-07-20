function preProcessingImage(project_name) {
  // Tạo giá trị 255.0 để chuẩn hóa pixel
  let offset = tf.scalar(255.0);
  // Đọc ảnh grayscale & Resize ảnh
  let tensor = tf.browser
    .fromPixels(raw_image, 1)
    .resizeNearestNeighbor(getImageSize())
    .toFloat();
  switch (project_name) {
    case "covid":
      // Chuẩn hóa pixel ảnh về dạng [0-1]
      tensor = tensor.div(offset);
      // Mở rộng chiều của mảng
      tensor = tensor.expandDims(0);
      break;
    default:
      tensor = tensor.expandDims(0);
      break;
  }
  console.log(`${project_name}: Input image tensor shape: ${tensor.shape}`);
  return tensor;
}

async function beginPred() {
  $("canvas").empty();
  // Tải mô hình
  await loadModel();
  // Tiền xử lý ảnh đầu vào
  const img_tensor = await preProcessingImage(project.name);
  // Bắt đầu dự đoán & xuất kết quả
  const predictions = model.predict(img_tensor);
  const results = await predictions.dataSync();
  // Lấy thông tin mảng đầu ra để tạo mask RGBA
  const [height, width, channels] = predictions.shape.slice(1);
  // Tạo mask RGBA 
  const mask = new Uint8ClampedArray(height * width * channels);
  // Trích xuất từng channel & thêm vào mask
  for (let i = 0; i < width * height; i++) {
    const idx = i * channels;
    const r = results[idx + 0] * 255; // Ground glass
    const g = results[idx + 1] * 255; // Consolidation
    const b = results[idx + 2] * 255; // Lung other
    const alpha = 255; // Alpha channel

    mask[i * 4 + 0] = r;
    mask[i * 4 + 1] = g;
    mask[i * 4 + 2] = b;
    mask[i * 4 + 3] = alpha;
  }
  // Vẽ mask lên canvas tag
  const canvas = $("canvas")[0];
  canvas.width = width
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const image_data = new ImageData(mask, width, height);
  ctx.putImageData(image_data, 0, 0);
  // Nhân bản mask & thêm vào img tag mới
  const pred_mask = $("#predMask")[0];
  pred_mask.src = canvas.toDataURL();
}

$(document).ready(function () {
  // Nếu có hành động upload ảnh thì thực thi loadImage
  $("#inFile").on("change", loadImage);

  // Nếu có hành động nhấn vào nút dự đoán thì bắt đầu dự đoán
  $("#btnPred").on("click", beginPred);
});
