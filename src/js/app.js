// 课程作业管理系统 - 主逻辑

// 模拟数据存储
const store = {
  currentUser: null,
  currentRole: 'teacher', // 'teacher' or 'student'
  
  // 模拟作业数据
  assignments: [
    {
      id: 1,
      title: '实验一：交互设计原型制作',
      description: '使用 HTML/CSS/JS 实现课程作业管理系统的交互原型，包含登录页、教师端和学生端共 7 个页面。',
      openTime: '2026-05-01T09:00',
      deadline: '2026-05-08T23:59',
      requirements: '提交 HTML 文件 + 实验报告 PDF',
      attachments: [{ name: '实验一说明.pdf', size: '1.2 MB' }],
      status: 'closed', // 'ongoing', 'upcoming', 'closed'
      submissions: [
        { studentId: '2023001', studentName: '张三', submitTime: '2026-05-07T22:43', file: 'exp1_group1.zip' },
        { studentId: '2023002', studentName: '李四', submitTime: '2026-05-07T20:15', file: 'exp1_group2.zip' }
      ]
    },
    {
      id: 2,
      title: '实验二：需求分析报告',
      description: '完成课程作业管理系统的需求分析，包括用户画像、用例图、功能需求列表等。',
      openTime: '2026-05-10T09:00',
      deadline: new Date(Date.now() + 32 * 60 * 60 * 1000).toISOString().slice(0, 16), // 约 32 小时后
      requirements: 'PDF 格式，不少于 2000 字',
      attachments: [{ name: '需求分析模板.docx', size: '856 KB' }],
      status: 'ongoing',
      submissions: []
    },
    {
      id: 3,
      title: '实验三：Web 界面设计与实现',
      description: '请各组按照提供的设计图，独立实现课程作业管理系统的学生端页面，包括：作业列表、作业详情、提交作业三个页面。要求代码规范、界面美观、交互流畅，并在实验报告中标注各页面体现的 HCI 设计原则（至少各标注 3 条）。',
      openTime: '2026-05-14T09:00',
      deadline: '2026-05-28T23:59',
      requirements: '压缩包（源码 + 实验报告 PDF），不超过 50MB',
      attachments: [{ name: '实验三 - 设计图参考.pdf', size: '2.3 MB' }],
      status: 'ongoing',
      submissions: []
    }
  ],
  
  // 模拟学生数据
  students: [
    { id: '2023001', name: '张三', group: 1 },
    { id: '2023002', name: '李四', group: 1 },
    { id: '2023003', name: '王五', group: 2 },
    { id: '2023004', name: '赵六', group: 2 },
    { id: '2023005', name: '钱七', group: 3 },
    { id: '2023006', name: '孙八', group: 3 }
  ],
  
  // 测试账号
  testAccounts: {
    teacher: { username: 'teacher001', password: 'test123' },
    students: [
      { username: 'student001', password: 'test123' },
      { username: 'student002', password: 'test123' },
      { username: 'student003', password: 'test123' }
    ]
  }
};

// 工具函数
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function getRelativeTime(deadline) {
  const now = new Date();
  const end = new Date(deadline);
  const diff = end - now;
  
  if (diff <= 0) {
    return { text: '已截止', urgent: false, overdue: true };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  const isUrgent = diff <= 24 * 60 * 60 * 1000; // 24 小时内
  return {
    text: `剩余 ${days}天${hours > 0 ? hours + '小时' : ''}`,
    urgent: isUrgent,
    overdue: false
  };
}

function getStatusBadge(status) {
  switch(status) {
    case 'ongoing': return '<span class="badge badge-blue">进行中</span>';
    case 'upcoming': return '<span class="badge badge-amber">即将开始</span>';
    case 'closed': return '<span class="badge badge-gray">已截止</span>';
    default: return '';
  }
}

// 页面导航
function showPage(pageId) {
  // 隐藏所有页面
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // 显示目标页面
  const targetPage = document.getElementById(`page-${pageId}`);
  if (targetPage) {
    targetPage.classList.add('active');
  }
  
  // 更新导航状态
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.getElementById(`nav-${pageId}`);
  if (navItem) {
    navItem.classList.add('active');
  }
  
  // 页面初始化
  initPage(pageId);
}

function initPage(pageId) {
  switch(pageId) {
    case 'login':
      initLoginPage();
      break;
    case 't-list':
      renderTeacherAssignmentList();
      break;
    case 't-create':
      initCreateAssignment();
      break;
    case 't-submissions':
      renderSubmissions();
      break;
    case 's-list':
      renderStudentAssignmentList();
      break;
    case 's-detail':
      renderAssignmentDetail();
      break;
    case 's-submit':
      initSubmitPage();
      break;
  }
}

// 登录页
let selectedRole = 'teacher';

function selectRole(role) {
  selectedRole = role;
  document.getElementById('role-teacher').classList.toggle('selected', role === 'teacher');
  document.getElementById('role-student').classList.toggle('selected', role === 'student');
}

function initLoginPage() {
  // 重置表单
  document.getElementById('login-form')?.reset();
  document.getElementById('err-msg').style.display = 'none';
  selectRole('teacher');
}

function handleLogin(event) {
  event.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errMsg = document.getElementById('err-msg');
  
  // 验证
  let isValid = false;
  
  if (selectedRole === 'teacher') {
    if (username === store.testAccounts.teacher.username && password === store.testAccounts.teacher.password) {
      isValid = true;
      store.currentUser = { role: 'teacher', username };
    }
  } else {
    const student = store.testAccounts.students.find(s => s.username === username && s.password === password);
    if (student) {
      isValid = true;
      store.currentUser = { role: 'student', username, ...student };
    }
  }
  
  if (isValid) {
    errMsg.style.display = 'none';
    // 跳转到对应首页
    if (selectedRole === 'teacher') {
      showPage('t-list');
    } else {
      showPage('s-list');
    }
  } else {
    errMsg.textContent = selectedRole === 'teacher' ? '教师账号或密码错误' : '学生账号或密码错误';
    errMsg.style.display = 'flex';
  }
}

function showForgotPassword() {
  alert('请联系系统管理员重置密码！\n\n教师账号：teacher001\n学生账号：student001 ~ student003\n默认密码：test123');
}

// 教师端 - 作业列表
function renderTeacherAssignmentList() {
  const container = document.getElementById('teacher-assignment-list');
  if (!container) return;
  
  const filter = document.getElementById('hw-filter')?.value || 'all';
  
  let filteredAssignments = store.assignments;
  if (filter === 'ongoing') {
    filteredAssignments = store.assignments.filter(a => a.status === 'ongoing');
  } else if (filter === 'closed') {
    filteredAssignments = store.assignments.filter(a => a.status === 'closed');
  }
  
  if (filteredAssignments.length === 0) {
    container.innerHTML = `
      <div class="card text-center" style="padding: 40px 20px;">
        <i class="ti ti-inbox" style="font-size: 48px; color: var(--color-text-tertiary);"></i>
        <p style="margin-top: 16px; color: var(--color-text-secondary);">暂无作业</p>
        <button class="btn btn-primary mt-2" onclick="showPage('t-create')">
          <i class="ti ti-plus"></i> 发布第一个作业
        </button>
      </div>
    `;
    return;
  }
  
  container.innerHTML = filteredAssignments.map(hw => {
    const totalStudents = store.students.length;
    const submittedCount = hw.submissions?.length || 0;
    const progressPercent = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;
    const relativeTime = getRelativeTime(hw.deadline);
    
    return `
      <div class="hw-item">
        <div class="hw-icon ${hw.status === 'ongoing' ? 'blue' : 'gray'}">
          <i class="ti ${hw.status === 'ongoing' ? 'ti-file-text' : 'ti-clock'}"></i>
        </div>
        <div class="hw-meta">
          <div class="hw-title">${hw.title}</div>
          <div class="hw-info">
            截止：${formatDate(hw.deadline)} 
            ${relativeTime.urgent && !relativeTime.overdue ? `<span class="deadline-urgent">（${relativeTime.text}）</span>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:12px;margin-top:6px;">
            <span>${submittedCount}/${totalStudents} 已提交</span>
            <div style="flex:1;max-width:150px;">
              <div class="progress-bar-wrap">
                <div class="progress-bar" style="width:${progressPercent}%"></div>
              </div>
            </div>
            <span style="font-size:11px;color:var(--color-text-tertiary)">${progressPercent}%</span>
          </div>
        </div>
        <div class="hw-actions">
          <button class="btn btn-sm" onclick="viewSubmissions(${hw.id})">
            <i class="ti ti-users"></i> 查看提交情况
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function viewSubmissions(assignmentId) {
  window.currentAssignmentId = assignmentId;
  showPage('t-submissions');
}

// 教师端 - 发布作业
function initCreateAssignment() {
  document.getElementById('create-assignment-form')?.reset();
  document.getElementById('file-preview')?.classList.add('hidden');
}

function validateDeadline() {
  const deadlineInput = document.getElementById('deadline');
  const deadline = new Date(deadlineInput.value);
  const now = new Date();
  
  if (deadline <= now) {
    alert('⚠️ 截止时间不能早于当前时间！\n\n请设置一个未来的截止时间。');
    deadlineInput.value = '';
    return false;
  }
  return true;
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    const preview = document.getElementById('file-preview');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    
    fileName.textContent = file.name;
    fileSize.textContent = (file.size / 1024 / 1024).toFixed(1) + ' MB';
    preview.classList.remove('hidden');
  }
}

function handleCreateAssignment(event) {
  event.preventDefault();
  
  if (!validateDeadline()) return;
  
  const title = document.getElementById('hw-title').value.trim();
  const description = document.getElementById('hw-description').value.trim();
  const deadline = document.getElementById('deadline').value;
  
  if (!title || !description || !deadline) {
    alert('请填写所有必填项！');
    return;
  }
  
  // 模拟创建成功
  alert('✅ 作业发布成功！\n\n作业已发布给所有学生。');
  showPage('t-list');
}

// 教师端 - 提交情况
let currentAssignmentId = null;

function renderSubmissions() {
  const assignment = store.assignments.find(a => a.id === window.currentAssignmentId);
  if (!assignment) return;
  
  document.querySelector('.page-header .page-desc').innerHTML = `${assignment.title} &nbsp;·&nbsp; 截止 ${formatDate(assignment.deadline)}`;
  
  const totalStudents = store.students.length;
  const submittedCount = assignment.submissions?.length || 0;
  const unsubmittedCount = totalStudents - submittedCount;
  const submissionRate = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;
  
  document.getElementById('stat-total').textContent = totalStudents;
  document.getElementById('stat-submitted').textContent = submittedCount;
  document.getElementById('stat-unsubmitted').textContent = unsubmittedCount;
  document.getElementById('stat-rate').textContent = submissionRate + '%';
  
  renderSubmissionTable('all');
}

function renderSubmissionTable(filter) {
  const assignment = store.assignments.find(a => a.id === window.currentAssignmentId);
  if (!assignment) return;
  
  const tbody = document.getElementById('submission-table-body');
  const submittedStudents = assignment.submissions || [];
  const submittedIds = submittedStudents.map(s => s.studentId);
  
  let studentsToShow = [];
  
  if (filter === 'all') {
    studentsToShow = store.students.map(s => ({
      ...s,
      submission: submittedStudents.find(sub => sub.studentId === s.id)
    }));
  } else if (filter === 'submitted') {
    studentsToShow = submittedStudents.map(s => ({
      ...store.students.find(st => st.id === s.studentId),
      submission: s
    }));
  } else if (filter === 'unsubmitted') {
    studentsToShow = store.students
      .filter(s => !submittedIds.includes(s.id))
      .map(s => ({ ...s, submission: null }));
  }
  
  if (studentsToShow.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;padding:40px;color:var(--color-text-tertiary)">
          <i class="ti ti-inbox" style="font-size:32px;"></i>
          <p style="margin-top:8px;">暂无数据</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = studentsToShow.map(s => {
    const hasSubmitted = !!s.submission;
    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="avatar">${s.name.slice(0, 1)}</div>
            ${s.name}
          </div>
        </td>
        <td style="color:var(--color-text-secondary)">${s.id}</td>
        <td style="color:var(--color-text-secondary)">
          ${hasSubmitted ? s.submission.submitTime.replace('T', ' ').slice(5, 16) : '——'}
        </td>
        <td>
          ${hasSubmitted ? `<a href="#" style="font-size:12px;color:var(--color-primary)">
            <i class="ti ti-file"></i> ${s.submission.file}
          </a>` : '<span style="color:var(--color-text-tertiary)">——</span>'}
        </td>
        <td>
          ${hasSubmitted 
            ? '<span class="badge badge-green"><i class="ti ti-check" style="font-size:11px"></i> 已提交</span>'
            : '<span class="badge badge-red"><i class="ti ti-clock" style="font-size:11px"></i> 未提交</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

function setSubmissionFilter(filter) {
  document.querySelectorAll('.tab-bar .tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  renderSubmissionTable(filter);
}

// 学生端 - 作业列表
function renderStudentAssignmentList() {
  const container = document.getElementById('student-assignment-list');
  if (!container) return;
  
  const pendingCount = store.assignments.filter(a => a.status === 'ongoing').length;
  const submittedCount = 1; // 模拟数据
  
  document.getElementById('stat-pending').textContent = pendingCount;
  document.getElementById('stat-student-submitted').textContent = submittedCount;
  document.getElementById('stat-week-deadline').textContent = pendingCount;
  
  const filter = document.getElementById('student-hw-filter')?.getAttribute('data-filter') || 'all';
  
  let filteredAssignments = store.assignments;
  if (filter === 'pending') {
    filteredAssignments = store.assignments.filter(a => a.status === 'ongoing');
  } else if (filter === 'submitted') {
    // 模拟：第一个作业已提交
    filteredAssignments = store.assignments.filter(a => a.id === 1);
  }
  
  container.innerHTML = filteredAssignments.map(hw => {
    const relativeTime = getRelativeTime(hw.deadline);
    const isSubmitted = hw.id === 1; // 模拟第一个作业已提交
    
    return `
      <div class="hw-item">
        <div class="hw-icon" style="background:${relativeTime.urgent && !relativeTime.overdue ? '#FCEBEB' : (isSubmitted ? '#EAF3DE' : '#E6F1FB')};color:${relativeTime.urgent && !relativeTime.overdue ? '#A32D2D' : (isSubmitted ? '#3B6D11' : '#185FA5')}">
          <i class="ti ${relativeTime.urgent && !relativeTime.overdue ? 'ti-alert-triangle' : (isSubmitted ? 'ti-check' : 'ti-file-text')}"></i>
        </div>
        <div class="hw-meta">
          <div class="hw-title">${hw.title}</div>
          <div class="hw-info">
            截止：${formatDate(hw.deadline)}
            ${!relativeTime.overdue ? `<span class="${relativeTime.urgent ? 'deadline-urgent' : 'deadline-ok'}">（${relativeTime.text}）</span>` : ''}
          </div>
          <div class="tag-list">
            ${getStatusBadge(hw.status)}
            <span class="badge ${isSubmitted ? 'badge-green' : 'badge-gray'}">
              ${isSubmitted ? '<i class="ti ti-check" style="font-size:10px"></i> 已提交' : '未提交'}
            </span>
          </div>
        </div>
        <div class="hw-actions">
          <button class="btn ${isSubmitted ? 'btn-sm' : 'btn-primary btn-sm'}" onclick="viewStudentDetail(${hw.id})">
            ${isSubmitted ? '查看详情' : '去提交'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function viewStudentDetail(assignmentId) {
  window.currentViewAssignmentId = assignmentId;
  showPage('s-detail');
}

// 学生端 - 作业详情
function renderAssignmentDetail() {
  const assignment = store.assignments.find(a => a.id === window.currentViewAssignmentId);
  if (!assignment) return;
  
  const isSubmitted = assignment.id === 1; // 模拟
  const relativeTime = getRelativeTime(assignment.deadline);
  
  document.getElementById('detail-title').textContent = assignment.title;
  document.getElementById('detail-status').innerHTML = `
    ${getStatusBadge(assignment.status)}
    <span class="badge ${isSubmitted ? 'badge-green' : 'badge-gray'}">
      ${isSubmitted ? '<i class="ti ti-check" style="font-size:10px"></i> 已提交' : '未提交'}
    </span>
  `;
  document.getElementById('detail-open-time').textContent = formatDate(assignment.openTime);
  document.getElementById('detail-deadline').innerHTML = `${formatDate(assignment.deadline)} <span class="badge badge-green" style="margin-left:4px">${relativeTime.text}</span>`;
  document.getElementById('detail-requirements').textContent = assignment.requirements;
  document.getElementById('detail-description').textContent = assignment.description;
  
  // 附件
  const attachmentsContainer = document.getElementById('detail-attachments');
  if (assignment.attachments && assignment.attachments.length > 0) {
    attachmentsContainer.innerHTML = assignment.attachments.map(att => `
      <div class="submitted-file">
        <i class="ti ti-file-type-pdf" style="font-size:18px;color:#A32D2D"></i>
        <div style="flex:1">
          <div style="font-size:13px">${att.name}</div>
          <div style="font-size:11px;color:var(--color-text-tertiary)">${att.size}</div>
        </div>
        <button class="btn btn-sm"><i class="ti ti-download"></i> 下载</button>
      </div>
    `).join('');
  }
  
  // 提交状态区域
  const submitStatusArea = document.getElementById('submit-status-area');
  if (isSubmitted) {
    submitStatusArea.innerHTML = `
      <div class="card">
        <div class="card-title"><i class="ti ti-upload" style="font-size:15px;color:var(--color-primary)"></i> 提交状态</div>
        <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:12px">
          您已于 ${formatDate('2026-05-07T22:43')} 提交
        </div>
        <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="showPage('s-submit')">
          <i class="ti ti-refresh"></i> 重新提交
        </button>
      </div>
    `;
  } else {
    submitStatusArea.innerHTML = `
      <div class="card">
        <div class="card-title"><i class="ti ti-upload" style="font-size:15px;color:var(--color-primary)"></i> 提交状态</div>
        <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:12px">您尚未提交本次作业</div>
        <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="showPage('s-submit')">
          <i class="ti ti-upload"></i> 去提交作业
        </button>
      </div>
    `;
  }
}

// 学生端 - 提交作业
function initSubmitPage() {
  document.getElementById('submit-form-area').style.display = 'block';
  document.getElementById('success-area').style.display = 'none';
  document.getElementById('file-preview')?.classList.add('hidden');
  document.getElementById('submit-form')?.reset();
  
  // 重置检查清单
  document.querySelectorAll('.check-box').forEach(box => {
    box.classList.remove('checked');
    box.innerHTML = '';
  });
}

function toggleCheck(el) {
  const box = el.querySelector('.check-box');
  if (box.classList.contains('checked')) {
    box.classList.remove('checked');
    box.innerHTML = '';
  } else {
    box.classList.add('checked');
    box.innerHTML = '<i class="ti ti-check" style="font-size:10px"></i>';
  }
}

function handleStudentFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    const preview = document.getElementById('file-preview');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    
    fileName.textContent = file.name;
    fileSize.textContent = (file.size / 1024 / 1024).toFixed(1) + ' MB';
    preview.classList.remove('hidden');
    document.getElementById('file-item').style.display = 'flex';
  }
}

function removeFile() {
  document.getElementById('file-item').style.display = 'none';
  document.getElementById('file-input').value = '';
}

function handleSubmit(event) {
  event.preventDefault();
  
  const fileInput = document.getElementById('file-input');
  if (!fileInput.files || fileInput.files.length === 0) {
    alert('⚠️ 请上传作业文件！');
    return;
  }
  
  const file = fileInput.files[0];
  const now = new Date();
  const submitTime = now.toISOString().replace('T', ' ').slice(0, 19);
  
  // 显示成功页面
  document.getElementById('success-time').textContent = submitTime;
  document.getElementById('success-file').textContent = file.name;
  document.getElementById('submit-form-area').style.display = 'none';
  document.getElementById('success-area').style.display = 'block';
}

function resetSubmit() {
  document.getElementById('submit-form-area').style.display = 'block';
  document.getElementById('success-area').style.display = 'none';
  initSubmitPage();
}

// 过滤标签页
function setStudentFilter(filter) {
  document.querySelectorAll('#student-filter .tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  const tabs = {
    'all': '全部',
    'pending': '待完成',
    'submitted': '已提交'
  };
  
  // 更新 UI
  renderStudentAssignmentList();
}

// 登出
function logout() {
  if (confirm('确定要退出登录吗？')) {
    store.currentUser = null;
    showPage('login');
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  showPage('login');
});
