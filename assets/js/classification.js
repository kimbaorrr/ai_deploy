async function preProcessingImage(project_name) {
  /**
   * Tiền xử lý ảnh đầu vào trước khi đưa vào mô hình
   * @param {string} project_name Tên dự án
   */
  let offset = undefined;
  // Tạo tensor từ ảnh đầu vào & resize kíc thước ảnh về 224 x 224
  let tensor = tf.browser
    .fromPixels(raw_image)
    .resizeNearestNeighbor(getImageSize())
    .toFloat();
  switch (project_name) {
    case "mobilenet_v1":
      // Scale ảnh về dạng 0 - 1
      offset = tf.scalar(255.0);
      // Chuẩn hóa giá trị pixel
      tensor = tensor.div(offset);
      break;
    case "densenet_121":
      // Scale ảnh về dạng 0 - 1
      offset = tf.scalar(255.0);
      // Chuẩn hóa giá trị pixel
      tensor = tensor.div(offset);
      break;
    default:
      break;
  }
  // Mở rộng chiều của mảng dạng [batch_size, width, height, channels]
  tensor = tensor.expandDims(0);
  console.log(`${project_name}: Input image tensor shape: ${tensor.shape}`);
  return tensor;
}

async function beginPred() {
  /**
   * Dự đoán ảnh đầu vào & xuất kết quả dự đoán
   */
  // Tạo các mảng chứa kết quả đầu ra
  // Ẩn predResult
  predResult("hide");
  // Kéo xuống & hiện loading spinner
  scrollDown();
  loadingSpinner("show");
  // Tải mô hình
  await loadModel();
  // Tiền xử lý ảnh đầu vào
  const img_tensor = await preProcessingImage(project.name);
  // Bắt đầu dự đoán & xuất kết quả
  const predictions = await model.predict(img_tensor).dataSync();
  // Mapping dạng key:value, sắp xếp kết quả dự đoán theo thứ tự giảm dần & chỉ lấy tối đa 5 kết quả đầu ra có acc cao nhất
  const results = Array.from(predictions)
    .map((p, i) => ({ acc: p, cls: classes[i] }))
    .sort((a, b) => b.acc - a.acc)
    .slice(0, max_results);
  const results_label = results.map((r) => r.cls);
  const results_acc = results.map((r) => (r.acc * 100).toFixed(2));
  // Hiển thị nhãn, độ chính xác, mất mát sau khi dự đoán
  $("topResult").text(results_label[0]);
  $("topAcc").text(results_acc[0]);
  $("topLoss").text((100 - results_acc[0]).toFixed(2));
  // Ẩn loading spinner
  loadingSpinner("hide");
  // Hiện predResult
  predResult("show");
  // Nạp data cho biểu đồ dự đoán
  loadChart(results_label, results_acc);
  // Hiển thị vùng chứa biểu đồ
  predDetail("show");
  // Tiếp tục di chuyển xuống cuối trang
  scrollDown();
}

function loadChart(results_label, results_acc) {
  /**
   * Hiển thị biểu đồ dự đoán
   * @param {string} results_label: Mảng lưu trữ nhãn đầu ra dự đoán
   * @param {string} results_acc: Mảng ghi nhận độ tin cậy của đầu ra
   */
  // Chart
  let options = {
    noData: {
      text: "Không có dữ liệu !",
      align: "center",
      verticalAlign: "middle",
    },
    series: [{ name: "Accuracy", data: results_acc }],
    chart: {
      type: "bar",
      height: 350,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        endingShape: "rounded",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: results_label,
      title: {
        text: "Labels",
      },
    },
    yaxis: {
      title: {
        text: "% (Accuracy)",
        fontFamily: "Arial",
      },
      min: 0,
      max: 100,
      decimalsInFloat: 0,
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + "%";
        },
      },
    },
  };
  // Bắt đầu vẽ biểu đồ
  new ApexCharts($("#chart")[0], options).render();
}

$(document).ready(function () {
  // Nếu có hành động upload ảnh thì thực thi loadImage
  $("#inFile").on("change", loadImage);

  // Nếu có hành động nhấn vào nút dự đoán thì bắt đầu dự đoán
  $("#btnPred").on("click", beginPred);
});
