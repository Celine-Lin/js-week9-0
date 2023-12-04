//----------------------- Data
let orderData = [];

//----------------------- DOM
const orderBody = document.querySelector('.orderBody');
const discardAllOrderBtn = document.querySelector('.discardAllOrderBtn');

//----------------------- 監聽

// 監聽: ❶ 更新訂單、刪除單筆訂單
orderBody.addEventListener('click',e=>{
    e.preventDefault();
    // 更新訂單
    if(e.target.getAttribute('class') === 'orderStatus'){
        let id = e.target.dataset.orderid;
        let status = e.target.dataset.orderstatus;
        updateOrder(status,id);
    };
    // 刪除單筆訂單
    if(e.target.getAttribute('class') === 'delSingleOrder-Btn'){
        deleteSingleOrder(e.target.dataset.orderid);
    }
})

// 監聽: ❷ 刪除全部訂單
discardAllOrderBtn.addEventListener('click',e=>{
    e.preventDefault();
    // 防呆，讓user確認是否要全刪
    let userChoice = confirm("確定要刪除所有訂單內容？");
    if (userChoice) {
        deleteAllOrder();
    } else {
      return;
    }
})

//----------------------- HTML 模板引擎庫： Handlebars.js
const template = Handlebars.compile(`
    <tr>
        <td>{{id}}</td>
        <td>
            <p>{{user.name}}</p>
            <p>{{user.tel}}</p>
        </td>
        <td>{{user.address}}</td>
        <td>{{user.email}}</td> 
        <td>{{item}}</td>
        <td>{{timeStamp}}</td>
        <td>
            <a  href="#" 
                class="orderStatus" 
                data-orderstatus="{{paid}}" 
                data-orderid="{{id}}">
                {{orderPaid}}
            </a>
        </td>
        <td>
            <input  type="button" 
                    class="delSingleOrder-Btn" 
                    data-orderid="{{id}}" 
                    value="刪除">
        </td>
    </tr>
`);

//----------------------- 函式

// 函式：⓿ 初始化
init();
function init(){
    orderList();
}

// 函式：❶ 渲染訂單列表
function orderList(){
    axios
        .get(`${url}/admin/${apiKey}/orders`,tokenObj)
        .then(res=>{
            orderData = res.data.orders;
            // 使用 map + join('') + Handlebars.js 來組字串
            const str = orderData.map(i => {
                return template({
                    id: i.id,
                    user: {
                        name: i.user.name,
                        tel: i.user.tel,
                        address: i.user.address,
                        email: i.user.email
                    },
                    // 使用模板商品項目無法換行
                    item: i.products.map(product => {
                        return `【 ${product.title}*${product.quantity} 】`;
                    }).join('、'),
                    // 時間字串
                    timeStamp: new Date(i.createdAt * 1000).toLocaleDateString(),
                    paid: i.paid,
                    // 訂單狀態
                    orderPaid: i.paid === true ? '已處理' : '未處理'
                });
            }).join('');
            // 渲染畫面
            orderBody.innerHTML = str;
            // 渲染圖表
            renderC3_LV2(orderData);
        })
        .catch(err=>{console.log(err.message)})
}

// 函式：❷ 更新訂單
function updateOrder(status,id){
    let newStatus = status === true? false: true;
    axios
        .put(`${url}/admin/${apiKey}/orders`,{
            "data": {
              "id": id,
              "paid": newStatus
            }
          },tokenObj)
        .then(res=>{
            alert('訂單付款成功！');
            orderList();
        })
        .catch(err=>{console.log(err.message)})
}

// 函式：❸ 刪除單筆訂單
function deleteSingleOrder(id){
    axios
        .delete(`${url}/admin/${apiKey}/orders/${id}`,tokenObj)
        .then(res=>{
            alert('刪除單筆訂單成功！');
            orderList();
        })
        .catch(err=>{console.log(err.message)})
}

// 函式：❹ 刪除全部訂單
function deleteAllOrder(){
    axios
        .delete(`${url}/admin/${apiKey}/orders`,tokenObj)
        .then(res=>{
            alert('刪除全部訂單成功！');
            orderList();
        })
        .catch(err=>{console.log(err.message)})
}

// 函式: ❺ ChatGPT調整的圖表LV2
function renderC3_LV2_V2(orderData) {
    // 組成物件 { A:$1000, B:2000 ... }
    const total = orderData.reduce((acc, order) => {
        order.products.forEach(product => {
          acc[product.title] = (acc[product.title] || 0) + product.price * product.quantity;
        });
        return acc;
      }, {});
  
    const sortedChartData = Object.entries(total) // 物件轉陣列
        .sort((a, b) => b[1] - a[1])  // 排序由大到小
        .slice(0, 3);  // 從 index 0 位置開始，只取前三個值
  
    const otherTotal = Object.values(total)
        .slice(3)  // 從 index 3 位置開始的所有值
        .reduce((acc, val) => acc + val, 0);  // 加總

    // 將算好的其他品項總額推進陣列裡
    sortedChartData.push(['其他', otherTotal]);

    // C3.js
    const chart = c3.generate({
      bindto: '#chart',
      data: {
        type: "pie",
        columns: sortedChartData,
      },
      color: {
        pattern: ['#eca0ff', '#aab2ff', '#84ffc9', '#b5c6e0']
      }
    });
  }


//----------------------- 函式：補充，沒有使用到
// 函式: ❶ 校長圖表LV1
function renderC3(){
    let chartData = [];
    let total = {}; 
    // 1. 跑回圈抓資料
    // 組成 {收納: 12120, 床架: 16560, 窗簾: 2400}
    orderData.forEach(i=>{
        i.products.forEach(product=>{
            if(total[product.category] === undefined){
                total[product.category] = product.price * product.quantity;
            }else{
                total[product.category] += product.price * product.quantity;
            }
        })
    })
    // 2. 將 category 
    // 組成陣列 ['收納', '床架', '窗簾']
    let arrKeys = Object.keys(total);

    // 3. 跑迴圈對應值，再丟到chartData裡 
    // 組成： [[收納, 12120], [床架, 16560], [窗簾, 2400]]
    arrKeys.forEach(i=>{
        chartData.push([i,total[i]]);
    })
    console.log(chartData);

    // 4. C3.js
    let chart = c3.generate({
        bindto: '#chart', // HTML 元素綁定
        data: {
            type: "pie",
            columns: chartData,
            // colors:{
            //     "Louvre 雙人床架":"#DACBFF",
            //     "Antony 雙人床架":"#9D7FEA",
            //     "Anty 雙人床架": "#5434A7",
            //     "其他": "#301E5F",
            // }
        },
    });

}

// 函式: ❷ 校長圖表LV2
function renderC3_LV2(){
    let chartData = [];
    let total = {}; 
    // 1. 跑回圈抓資料
    // 組成 {收納: 12120, 床架: 16560, 窗簾: 2400}
    orderData.forEach(i=>{
        i.products.forEach(product=>{
            if(total[product.title] === undefined){
                total[product.title] = product.price * product.quantity;
            }else{
                total[product.title] += product.price * product.quantity;
            }
        })
    })
    // 2. 將 category 
    // 組成陣列 ['收納', '床架', '窗簾']
    let arrKeys = Object.keys(total);

    // 3. 跑迴圈對應值，再丟到chartData裡 
    // 組成： [[收納, 12120], [床架, 16560], [窗簾, 2400]]
    arrKeys.forEach(i=>{
        chartData.push([i,total[i]]);
    })

    chartData.sort((a,b)=>{
        return b[1]-a[1];
    });

    let otherTotal = 0;
    let newChartData = chartData.filter((i,index)=>{
        // 超過三筆資料的金額加總
        if(index>2){
            otherTotal += i[1];
        };
        return (index < 3);
    });
    newChartData.push(['其他',otherTotal]);

    // 4. C3.js
    let chart = c3.generate({
        bindto: '#chart', // HTML 元素綁定
        data: {
            type: "pie",
            columns: newChartData,
        },
        color: {
            pattern: ['#eca0ff', '#aab2ff', '#84ffc9', '#b5c6e0']
          }
    });
}

