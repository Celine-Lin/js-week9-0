//----------------------- Data
let productData = [];
let cartData = [];
let finalTotal = 0;
//----------------------- DOM

// DOM：產品
const productWrap = document.querySelector('.productWrap');
const productSelect = document.querySelector('.productSelect');

// DOM：購物車
const cartBody = document.querySelector('.cartBody');
const discardAllCartBtn = document.querySelector('.discardAllCartBtn');

// DOM：表單
const submitBtn = document.querySelector('.submitBtn');
const customerName = document.getElementById('customerName');
const customerPhone = document.getElementById('customerPhone');
const customerEmail = document.getElementById('customerEmail');
const customerAddress = document.getElementById('customerAddress');
const customerTradeWay = document.getElementById('tradeWay');

//----------------------- 監聽

// 監聽: ❶ 篩選分類
productSelect.addEventListener('change', e => {
    const category = e.target.value;
    if (category !== '全部') {
        let filteredProducts = productData.filter(product => product.category === category);
        // 函式：❷ 渲染產品列表
        renderProduct(filteredProducts);
    }else{
        // 函式：❷ 渲染產品列表
        renderProduct(productData);
    }
});

// 監聽: ❷ 加入購物車
productWrap.addEventListener('click',e=>{
    // 取消 a 連結預設行為
    e.preventDefault();

    // 確認有按到按鈕
    if(e.target.getAttribute('class') !== 'addCardBtn'){
        alert('你沒有點到按鈕喔！');
        return;
    }
    // 點擊後數字會更新
    let productId = e.target.dataset.id;
    let numCheck = 1;
    cartData.forEach(i=>{
        if(productId === i.product.id){ numCheck += i.quantity }
      }); 
    // POST API
    axios
        .post(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${apiKey}/carts`,
            {
                "data": {
                    "productId": productId,
                    "quantity": numCheck 
                }
            })
        .then(res=>{ 
            alert('成功加入購物車！');
            // 函式：❸ 渲染購物車
            renderCart();
        })
        .catch(err=>{console.log(err.message)})
})

// 監聽: ❸ 刪除單筆購物車
cartBody.addEventListener('click',e=>{
    e.preventDefault();
    const cartId = e.target.dataset.cartid;
    if(cartId == null){
        alert('你沒有點到刪除鍵！');
        return;
    }
    // DELETE API
    axios
        .delete(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${apiKey}/carts/${cartId}`)
        .then(res=>{
            alert('成功刪除一筆購物車商品');
            // 函式：❸ 渲染購物車
            renderCart();
        })
        .catch(err=>{console.log(err.message)})
    
})

// 監聽: ❹ 刪除全部購物車
discardAllCartBtn.addEventListener('click',e=>{
    // 預防 a 連結預設
    e.preventDefault();

    // 防呆，讓user確認是否要全刪
    let userChoice = confirm("確定要刪除購物車內所有商品？");
    if (userChoice) {
        // DELETE ALL API
        axios
            .delete(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${apiKey}/carts`)
            .then(res=>{
                alert('成功清空購物車！');
                // 函式：❸ 渲染購物車
                renderCart();
            })
            .catch(err=>{console.log(err.message)})
    } else {
      return;
    }
})

// 監聽: ❺ 送出訂單
submitBtn.addEventListener('click',e => {
    // 避免預設的表單送出行為
    e.preventDefault();

    // 確認購物車有商品
    if (cartData.length === 0) {
        alert('請先加入商品到購物車！');
        return;
    };

    // 函式：❹ 表單驗證
    if (!validateForm()) {
        return;
    }
    /// 函式：❺ 送出表單
    submitForm();
});

//----------------------- 函式

// 函式：⓿ 初始化
init();
function init(){
    axios
        .get(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${apiKey}/products`)
        .then(res=>{
            productData = res.data.products;
            // 函式：❷ 渲染產品列表
            renderProduct(productData);
            // 函式：❸ 渲染購物車
            renderCart();
        })
        .catch(err=>{console.log(err.message)})
}

// 函式：❶ 渲染產品列表
function renderProduct(data) {
    let str = "";
    data.forEach(product=>{
        str += 
        `<li class="productCard">
            <h4 class="productType">新品</h4>
            <img src="${product.images}" alt="">
            <a href="#" class="addCardBtn" data-id="${product.id}">加入購物車</a>
            <h3>${product.title}</h3>
            <del class="originPrice">NT$${product.origin_price}</del>
            <p class="nowPrice">NT$${product.price}</p>
        </li>`;
    })
    productWrap.innerHTML = str;
}

// 函式：❷ 渲染購物車
function renderCart(){
    axios
        .get(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${apiKey}/carts`)
        .then(res=>{

            // 購物車商品資訊
            cartData = res.data.carts;
            // 渲染畫面
            let str = '';
            cartData.forEach(i=>{
               str += 
               `<tr class="cartItemGroup">
                    <td>
                        <div class="cardItem-title">
                            <img src="${i.product.images}" alt="">
                            <p>Antony ${i.product.title}</p>
                        </div>
                    </td>
                    <td>NT$${i.product.price}</td>
                    <td>${i.quantity}</td>
                    <td>NT$${i.product.price * i.quantity}</td>
                    <td class="discardBtn">
                        <a href="#" class="material-icons" data-cartid="${i.id}">
                            clear
                        </a>
                    </td>
                </tr>`;
            });
            cartBody.innerHTML = str;

            // 購物車總金額
            finalTotal = res.data.finalTotal;
            // 渲染畫面
            document.querySelector('.cartFinalTotal').textContent = `NT$ ${finalTotal}`;
        })
        .catch(err=>{console.log(err.message)})
}

// 函式：❸ 表單驗證
function validateForm() {
    if (
        customerName.value === '' ||
        customerPhone.value === '' ||
        customerEmail.value === '' ||
        customerAddress.value === ''
    ) {
        alert('請輸入完整資料！');
        return false;
    }
    return true;
}

// 函式：❹ 送出表單
function submitForm() {
    axios
        .post(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${apiKey}/orders`, 
        {
            "data": {
                "user": {
                    "name": customerName.value,
                    "tel": customerPhone.value,
                    "email": customerEmail.value,
                    "address": customerAddress.value,
                    "payment": customerTradeWay.value
                }
            }
        })
        .then( res => {
            alert('表單成功送出！');
            renderCart();
            // 清空表單
            customerName.value = '';
            customerPhone.value = '';
            customerEmail.value = '';
            customerAddress.value = '';
            customerTradeWay.value = 'ATM';
        })
        .catch(err => {console.log(err.message)});
}