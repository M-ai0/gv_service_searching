<script>
    // APIキーの設定
    const DIFY_API_KEY = 'YOUR_API_KEY'; // GitHub Actionsで置換される
    const DIFY_API_URL = 'https://api.dify.ai/v1/chat-messages';

    // 都道府県データ
    const prefectures = [
        "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
        "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
        "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
        "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
        "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
        "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
        "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
    ];

    // デバッグ情報の表示
    function debugApiRequest(query) {
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.group('API Request Debug Info');
            console.log('API URL:', DIFY_API_URL);
            console.log('API Key Length:', DIFY_API_KEY.length);
            console.log('API Key Preview:', DIFY_API_KEY.substring(0, 5) + '...');
            console.log('Query:', query);
            console.groupEnd();
        }
    }

    // 都道府県選択肢の生成
    const prefectureSelect = document.getElementById('prefecture');
    prefectures.forEach(pref => {
        const option = document.createElement('option');
        option.value = pref;
        option.textContent = pref;
        prefectureSelect.appendChild(option);
    });

    // Dify APIにリクエストを送信
    async function sendToDify(query) {
        try {
            const response = await fetch(DIFY_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${DIFY_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: {},
                    query: query,
                    response_mode: 'blocking',
                    user: 'default-user'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                throw new Error(`API Error: ${response.status} - ${errorData.message || response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Request Error:', error);
            throw new Error(error.message || 'APIリクエストに失敗しました');
        }
    }

    // 結果表示
    function showResult(response) {
        const resultArea = document.querySelector('.result-area');
        const searchResult = document.getElementById('searchResult');
        const references = document.getElementById('references');

        // 検索結果の表示
        searchResult.innerHTML = response.answer.replace(/\n/g, '<br>');

        // 参考情報の表示
        if (response.metadata && response.metadata.retriever_resources) {
            const resourcesList = response.metadata.retriever_resources
                .map(resource => `<li>${resource.document_name || '不明なドキュメント'}</li>`)
                .join('');
            references.innerHTML = `
                <h3 class="font-semibold mb-2">参考情報：</h3>
                <ul class="list-disc pl-5">
                    ${resourcesList}
                </ul>
            `;
        } else {
            references.innerHTML = '';
        }

        resultArea.classList.add('active');
    }

    // エラー表示の改善
    function showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <svg class="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
                <span>${message}</span>
            </div>
        `;
        errorDiv.classList.remove('hidden');
    }

    // ローディング表示の切り替え
    function showLoading(show) {
        const loading = document.querySelector('.loading');
        if (show) {
            loading.classList.add('active');
        } else {
            loading.classList.remove('active');
        }
    }

    // エラーメッセージの非表示
    function hideError() {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.classList.add('hidden');
    }

    // 結果エリアの非表示
    function hideResult() {
        const resultArea = document.querySelector('.result-area');
        resultArea.classList.remove('active');
    }

    // フォーム送信処理
    document.getElementById('searchForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const form = e.target;
        const formData = {
            年齢: form.age.value,
            性別: form.gender.value, 
            最終学歴: form.education.value,
            就業状態: form.employmentStatus.value,
            居住形態: form.livingArrangement.value,
            居住地域_都道府県: form.prefecture.value,
            居住地域_市区町村: form.city.value,
            世帯年収: form.income.value,
            婚姻状況: form.maritalStatus.value,
            扶養家族: form.dependents.value
        };

        // 入力チェック
        if (!formData.年齢 || !formData.性別 || !formData.最終学歴 || !formData.就業状態 || 
            !formData.居住形態 || !formData.居住地域_都道府県 || !formData.居住地域_市区町村 ||
            !formData.世帯年収 || !formData.婚姻状況 || !formData.扶養家族) {
            showError('すべての項目を入力してください。');
            return;
        }

        // 検索クエリの作成
        const query = `
            {
            "年齢": ${formData.年齢},
            "性別": "${formData.性別}",
            "最終学歴": "${formData.最終学歴}",
            "就業状態": "${formData.就業状態}",
            "居住体系": "${formData.居住形態}",
            "居住地域_都道府県": "${formData.居住地域_都道府県}",
            "居住地域_市区町村": "${formData.居住地域_市区町村}",
            "世帯年収": "${formData.世帯年収}",
            "婚姻状況": "${formData.婚姻状況}",
            "扶養家族": "${formData.扶養家族}"
            }
        `;

        // ローディング表示
        showLoading(true);
        hideError();
        hideResult();

        try {
            // デバッグ情報の表示
            debugApiRequest(query);

            const response = await sendToDify(query);
            if (response && response.answer) {
                showResult(response);
            }
        } catch (error) {
            console.error('Error details:', error);
            showError(`検索中にエラーが発生しました: ${error.message}`);
        } finally {
            showLoading(false);
        }
    });
</script>
