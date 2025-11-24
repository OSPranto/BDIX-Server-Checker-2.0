// পরীক্ষার জন্য Time-out সেটিংস (মিলি-সেকেন্ডে)
const TIMEOUT_MS = 5000; // 5 সেকেন্ড

// DOM উপাদানগুলি নির্বাচন
const startButton = document.getElementById('start-button');
const workingList = document.getElementById('working-list');
const notWorkingList = document.getElementById('not-working-list');
const loadingMessage = document.getElementById('loading-message');
const workingSection = document.getElementById('working-section');
const notWorkingSection = document.getElementById('not-working-section');

/**
 * সমস্ত তালিকা পরিষ্কার করে দেয়।
 */
function clearLists() {
    workingList.innerHTML = '';
    notWorkingList.innerHTML = '';
    workingSection.style.display = 'none';
    notWorkingSection.style.display = 'none';
}

/**
 * একটি সার্ভারকে Working হিসেবে ডিসপ্লে করে।
 * @param {object} server - সার্ভার অবজেক্ট { name, url }
 */
function displayWorking(server) {
    const listItem = document.createElement('li');
    listItem.className = 'server-item working';
    listItem.innerHTML = `
        <span>${server.name}</span>
        <a href="${server.url}" target="_blank">${server.url}</a>
        <span class="status-icon">Working</span>
    `;
    workingList.appendChild(listItem);
}

/**
 * একটি সার্ভারকে Not Working হিসেবে ডিসপ্লে করে।
 * @param {object} server - সার্ভার অবজেক্ট { name, url }
 */
function displayNotWorking(server) {
    const listItem = document.createElement('li');
    listItem.className = 'server-item not-working';
    listItem.innerHTML = `
        <span>${server.name}</span>
        <a href="${server.url}" target="_blank">${server.url}</a>
        <span class="status-icon">Not Working</span>
    `;
    notWorkingList.appendChild(listItem);
}

/**
 * সার্ভার স্ট্যাটাস চেক করার মূল ফাংশন।
 * @param {string} url - যে URL টি চেক করতে হবে।
 * @returns {Promise<boolean>} - যদি সার্ভার কাজ করে তাহলে true, না হলে false.
 */
async function checkServerStatus(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        await fetch(url, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return true; 

    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.log(`Timeout for: ${url}`);
        } else {
            console.error(`Error checking ${url}:`, error.message);
        }
        return false;
    }
}

/**
 * servers.json ফাইল থেকে সার্ভার ডেটা লোড করে।
 * @returns {Promise<Array>} - সার্ভার অবজেক্টের অ্যারে
 */
async function loadServers() {
    try {
        const response = await fetch('servers.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error("Error loading servers.json:", error);
        alert("Servers file লোড করা যায়নি। ফাইলটি ঠিক আছে কিনা দেখুন।");
        return [];
    }
}

/**
 * সমস্ত সার্ভার চেক করা এবং ফলাফল ডিসপ্লে করার মূল ফাংশন।
 */
async function checkAllServers() {
    // 1. UI স্টেট আপডেট
    clearLists();
    startButton.style.display = 'none';
    loadingMessage.style.display = 'block';

    // 2. সার্ভার ডেটা লোড করা
    const bdixServers = await loadServers();

    // 3. প্রতিটি সার্ভার চেক করা
    const checkPromises = bdixServers.map(async (server) => {
        const isWorking = await checkServerStatus(server.url);
        if (isWorking) {
            displayWorking(server);
        } else {
            displayNotWorking(server);
        }
    });

    // সব চেক শেষ হওয়া পর্যন্ত অপেক্ষা করা
    await Promise.all(checkPromises);

    // 4. ফলাফল ডিসপ্লে করা
    loadingMessage.style.display = 'none';
    startButton.style.display = 'block'; // চেক শেষে বাটন আবার দেখানো

    if (workingList.children.length > 0) {
        workingSection.style.display = 'block';
    }
    if (notWorkingList.children.length > 0) {
        notWorkingSection.style.display = 'block';
    }
}

// "Start Check" বাটনে ইভেন্ট লিসেনার যোগ করা
startButton.addEventListener('click', checkAllServers);

// শুরুতেই তালিকাগুলো ফাঁকা রাখা এবং সেকশনগুলো লুকিয়ে রাখা
clearLists();
