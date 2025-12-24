export type LocaleMessages = {
  home: {
    random: string
    hot: string
    time: string
    searchPlaceholder: string
    startExploring: string
    retry: string
    failedToLoad: string
  }
  login: {
    title: string
    tagline: string
    password: string
    otpCode: string
    emailAddress: string
    emailPlaceholder: string
    passwordLabel: string
    passwordPlaceholder: string
    forgotPassword: string
    verificationCode: string
    verificationPlaceholder: string
    sendCode: string
    resend: string
    continue: string
    welcomeAboard: string
    setPassword: string
    newPassword: string
    confirmPassword: string
    cancel: string
    createAccount: string
    invalidEmail: string
    sendCodeFailed: string
    errorSendingCode: string
    invalidEmailFormat: string
    welcomeBack: string
    loginFailed: string
    completeRegistration: string
    passwordMinLength: string
    passwordsNotMatch: string
    accountCreated: string
    registrationFailed: string
  }
  navbar: {
    whatWeLike: string
    giphy: string
    notifications: string
    markAllRead: string
    noNotifications: string
    upload: string
    login: string
    profile: string
    lightMode: string
    darkMode: string
    switchToEnglish: string
    switchToChinese: string
  }
  profile: {
    myUploads: string
    likes: string
    myMasterpieces: string
    collections: string
    daysJoined: string
    emptyUploads: string
    emptyUploadsDesc: string
    goToHome: string
    noCollections: string
    noCollectionsDesc: string
    backToCollections: string
    emptyCategory: string
    loadMore: string
    editNickname: string
    save: string
    cancel: string
    logout: string
    deleteAccount: string
    deleteAccountTitle: string
    deleteAccountWarning: string
    enterPassword: string
    confirmDelete: string
    deleting: string
    nicknameUpdated: string
    updateNicknameFailed: string
    loggedOut: string
    logoutFailed: string
    accountDeleted: string
    deleteAccountFailed: string
  }
  upload: {
    title: string
    adminReviewWarning: string
    dragDropHere: string
    orClickToBrowse: string
    titleLabel: string
    titlePlaceholder: string
    tagsLabel: string
    tagsHint: string
    tagsPlaceholder: string
    descriptionLabel: string
    descriptionPlaceholder: string
    uploadButton: string
    uploading: string
    uploadSuccess: string
    uploadFailed: string
    maxTagsWarning: string
    pleaseUploadImage: string
  }
  giphy: {
    trending: string
    resultsFor: string
    searchPlaceholder: string
    noResults: string
    retry: string
    failedToLoad: string
    by: string
    source: string
    poweredByGiphy: string
    iLikeIt: string
    maybeLater: string
    thankYouLike: string
    likeFailed: string
  }
  detail: {
    loading: string
    notFound: string
    views: string
    downloads: string
    poweredByGiphy: string
    pleaseLogin: string
    unliked: string
    operationFailed: string
    downloading: string
    downloadSuccess: string
    downloadFailed: string
    linkCopied: string
    copyFailed: string
    anonymous: string
    untitled: string
  }
  settings: {
    videoPlayback: string
    loopCount: string
    infinite: string
  }
}

export const messages: Record<'zh-CN' | 'en-US', LocaleMessages> = {
  'zh-CN': {
    home: {
      random: '随机',
      hot: '热度',
      time: '时间',
      searchPlaceholder: '搜索 GIF、贴纸...',
      startExploring: '开始探索',
      retry: '重试',
      failedToLoad: '加载失败',
    },
    login: {
      title: 'GifHub',
      tagline: '探索无限的动态宇宙',
      password: '密码',
      otpCode: '验证码',
      emailAddress: '邮箱地址',
      emailPlaceholder: 'hello@example.com',
      passwordLabel: '密码',
      passwordPlaceholder: '••••••••',
      forgotPassword: '忘记密码？',
      verificationCode: '验证码',
      verificationPlaceholder: '请输入6位验证码',
      sendCode: '发送验证码',
      resend: '重新发送',
      continue: '继续',
      welcomeAboard: '欢迎加入 🚀',
      setPassword: '设置安全密码来完成账户创建',
      newPassword: '新密码',
      confirmPassword: '确认密码',
      cancel: '取消',
      createAccount: '创建账户',
      invalidEmail: '请输入有效的邮箱地址',
      sendCodeFailed: '发送验证码失败',
      errorSendingCode: '发送验证码时出错',
      invalidEmailFormat: '邮箱格式不正确',
      welcomeBack: '欢迎回来！',
      loginFailed: '登录失败',
      completeRegistration: '请设置密码完成注册',
      passwordMinLength: '密码至少需要6个字符',
      passwordsNotMatch: '两次密码不匹配',
      accountCreated: '账户创建成功！正在登录...',
      registrationFailed: '注册失败',
    },
    navbar: {
      whatWeLike: 'What We Like',
      giphy: 'GIPHY',
      notifications: '通知',
      markAllRead: '全部已读',
      noNotifications: '暂无通知',
      upload: '上传',
      login: '登录',
      profile: '个人信息',
      lightMode: '☀️ 浅色模式',
      darkMode: '🌙 深色模式',
      switchToEnglish: 'Switch to English',
      switchToChinese: '切换到中文',
    },
    profile: {
      myUploads: '我的上传',
      likes: '我的收藏',
      myMasterpieces: '我的杰作',
      collections: '收集的心动',
      daysJoined: '入驻天数',
      emptyUploads: '你的银河空空如也',
      emptyUploadsDesc: '探索更多动图，开始你的创作之旅吧！',
      goToHome: '去首页看看',
      noCollections: '还没有收藏集',
      noCollectionsDesc: '看到喜欢的 GIF 时点击收藏，它们会在这里等待你。',
      backToCollections: '返回收藏集',
      emptyCategory: '这个系列还在等待新的成员...',
      loadMore: '加载更多',
      editNickname: '编辑昵称',
      save: '保存',
      cancel: '取消',
      logout: '退出登录',
      deleteAccount: '注销账号',
      deleteAccountTitle: '注销账号',
      deleteAccountWarning:
        '⚠️ 此操作将永久删除您的账号及所有相关数据，且邮箱24小时内无法重新注册。',
      enterPassword: '请输入密码确认',
      confirmDelete: '确认注销',
      deleting: '处理中...',
      nicknameUpdated: '昵称修改成功',
      updateNicknameFailed: '修改昵称失败',
      loggedOut: '已退出登录',
      logoutFailed: '退出登录失败',
      accountDeleted: '账号已注销',
      deleteAccountFailed: '注销账号失败',
    },
    upload: {
      title: '上传 GIF',
      adminReviewWarning: '上传的内容需要管理员审核后才能公开展示',
      dragDropHere: '拖放 GIF 到这里',
      orClickToBrowse: '或点击浏览',
      titleLabel: '标题',
      titlePlaceholder: '给它起个吸引人的标题',
      tagsLabel: '标签',
      tagsHint: '(逗号分隔，最多3个)',
      tagsPlaceholder: '搞笑, 猫咪, 表情包',
      descriptionLabel: '描述（可选）',
      descriptionPlaceholder: '告诉我们更多关于这个 GIF 的信息',
      uploadButton: '上传 GIF',
      uploading: '上传中...',
      uploadSuccess: '上传成功！',
      uploadFailed: '上传失败',
      maxTagsWarning: '最多允许3个标签',
      pleaseUploadImage: '请上传图片文件（GIF）',
    },
    giphy: {
      trending: 'GIPHY 热门',
      resultsFor: '搜索结果',
      searchPlaceholder: '搜索 GIPHY...',
      noResults: '未找到 GIF',
      retry: '重试',
      failedToLoad: '加载失败',
      by: '作者',
      source: '来源',
      poweredByGiphy: '由 Giphy 提供支持',
      iLikeIt: '我喜欢！',
      maybeLater: '下次再说',
      thankYouLike: '感谢您的喜欢！❤️',
      likeFailed: '操作失败',
    },
    detail: {
      loading: '加载中...',
      notFound: '未找到 GIF',
      views: '次观看',
      downloads: '次下载',
      poweredByGiphy: '由 Giphy 提供',
      pleaseLogin: '请先登录',
      unliked: '已取消收藏',
      operationFailed: '操作失败',
      downloading: '正在下载中，请稍后',
      downloadSuccess: '下载成功',
      downloadFailed: '下载失败，请重试',
      linkCopied: '链接已复制',
      copyFailed: '复制失败，请重试',
      anonymous: '匿名用户',
      untitled: '无标题 GIF',
    },
    settings: {
      videoPlayback: '动图播放设置',
      loopCount: '循环次数',
      infinite: '无限',
    },
  },
  'en-US': {
    home: {
      random: 'Random',
      hot: 'Hot',
      time: 'Latest',
      searchPlaceholder: 'Search for GIFs, Stickers...',
      startExploring: 'Start Exploring',
      retry: 'Retry',
      failedToLoad: 'Failed to load GIFs',
    },
    login: {
      title: 'GifHub',
      tagline: 'Explore the infinite universe of motion.',
      password: 'Password',
      otpCode: 'OTP Code',
      emailAddress: 'Email Address',
      emailPlaceholder: 'hello@example.com',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      forgotPassword: 'Forgot password?',
      verificationCode: 'Verification Code',
      verificationPlaceholder: 'Enter 6-digit code',
      sendCode: 'Send Code',
      resend: 'Resend',
      continue: 'Continue',
      welcomeAboard: 'Welcome Aboard 🚀',
      setPassword: 'Set a secure password to complete your account.',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      cancel: 'Cancel',
      createAccount: 'Create Account',
      invalidEmail: 'Please enter a valid email address',
      sendCodeFailed: 'Failed to send verification code',
      errorSendingCode: 'Error sending code',
      invalidEmailFormat: 'Invalid email format',
      welcomeBack: 'Welcome back!',
      loginFailed: 'Login failed',
      completeRegistration: 'Please set a password to complete registration',
      passwordMinLength: 'Password must be at least 6 characters',
      passwordsNotMatch: 'Passwords do not match',
      accountCreated: 'Account created successfully! Logging you in...',
      registrationFailed: 'Registration failed',
    },
    navbar: {
      whatWeLike: 'What We Like',
      giphy: 'GIPHY',
      notifications: 'Notifications',
      markAllRead: 'Mark all as read',
      noNotifications: 'No notifications',
      upload: 'Upload',
      login: 'Login',
      profile: 'Profile',
      lightMode: '☀️ Light Mode',
      darkMode: '🌙 Dark Mode',
      switchToEnglish: 'Switch to English',
      switchToChinese: '切换到中文',
    },
    profile: {
      myUploads: 'My Uploads',
      likes: 'Likes',
      myMasterpieces: 'My Masterpieces',
      collections: 'Collections',
      daysJoined: 'Days Joined',
      emptyUploads: 'Your galaxy is empty',
      emptyUploadsDesc: 'Explore more GIFs and start your creative journey!',
      goToHome: 'Go to Home',
      noCollections: 'No collections yet',
      noCollectionsDesc: 'When you like a GIF, it will be waiting for you here.',
      backToCollections: 'Back to Collections',
      emptyCategory: 'This collection is waiting for new members...',
      loadMore: 'Load More',
      editNickname: 'Edit Nickname',
      save: 'Save',
      cancel: 'Cancel',
      logout: 'Logout',
      deleteAccount: 'Delete Account',
      deleteAccountTitle: 'Delete Account',
      deleteAccountWarning:
        '⚠️ This will permanently delete your account and all related data. Your email cannot be re-registered for 24 hours.',
      enterPassword: 'Enter password to confirm',
      confirmDelete: 'Confirm Delete',
      deleting: 'Processing...',
      nicknameUpdated: 'Nickname updated successfully',
      updateNicknameFailed: 'Failed to update nickname',
      loggedOut: 'Logged out successfully',
      logoutFailed: 'Failed to logout',
      accountDeleted: 'Account deleted successfully',
      deleteAccountFailed: 'Failed to delete account',
    },
    upload: {
      title: 'Upload GIF',
      adminReviewWarning: 'Uploaded content requires admin review before public display',
      dragDropHere: 'Drag & drop your GIF here',
      orClickToBrowse: 'or click to browse',
      titleLabel: 'Title',
      titlePlaceholder: 'Give it a catchy title',
      tagsLabel: 'Tags',
      tagsHint: '(Comma separated, max 3)',
      tagsPlaceholder: 'funny, cat, meme',
      descriptionLabel: 'Description (Optional)',
      descriptionPlaceholder: 'Tell us more about this GIF',
      uploadButton: 'Upload GIF',
      uploading: 'Uploading...',
      uploadSuccess: 'Upload successful!',
      uploadFailed: 'Upload failed',
      maxTagsWarning: 'Max 3 tags allowed',
      pleaseUploadImage: 'Please upload an image file (GIF)',
    },
    giphy: {
      trending: 'Trending on GIPHY',
      resultsFor: 'Results for',
      searchPlaceholder: 'Search GIPHY...',
      noResults: 'No GIFs found.',
      retry: 'Retry',
      failedToLoad: 'Failed to load GIFs',
      by: 'By',
      source: 'Source',
      poweredByGiphy: 'Powered By Giphy',
      iLikeIt: 'I Like It!',
      maybeLater: 'Maybe Later',
      thankYouLike: 'Thank you for your like! ❤️',
      likeFailed: 'Failed to like',
    },
    detail: {
      loading: 'Loading...',
      notFound: 'GIF not found',
      views: 'views',
      downloads: 'downloads',
      poweredByGiphy: 'Powered by Giphy',
      pleaseLogin: 'Please login first',
      unliked: 'Removed from favorites',
      operationFailed: 'Operation failed',
      downloading: 'Downloading, please wait',
      downloadSuccess: 'Download successful',
      downloadFailed: 'Download failed, please retry',
      linkCopied: 'Link copied',
      copyFailed: 'Copy failed, please retry',
      anonymous: 'Anonymous',
      untitled: 'Untitled GIF',
    },
    settings: {
      videoPlayback: 'Video Playback',
      loopCount: 'Loop Count',
      infinite: 'Infinite',
    },
  },
}
