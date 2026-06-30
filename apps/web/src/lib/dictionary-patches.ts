import type { Locale } from "./types";

export const dictionaryPatches: Record<Locale, Record<string, unknown>> = {
  ru: {
    common: {
      language: "Язык",
      platformTag: "Премиальная турнирная экосистема",
      statuses: {
        draft: "\u0427\u0435\u0440\u043d\u043e\u0432\u0438\u043a",
        registration: "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f",
        live: "\u0418\u0434\u0435\u0442 \u0441\u0435\u0439\u0447\u0430\u0441",
        finished: "\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043d"
      },
      stats: {
        points: "Очки"
      }
    },
    nav: {
      home: "Главная",
      tournaments: "Турниры",
      players: "Игроки",
      rankings: "Рейтинги",
      clubs: "Клубы",
      news: "Новости",
      media: "Медиа",
      signin: "Войти",
      signup: "Создать аккаунт"
    },
    forms: {
      password: "Пароль",
      selectOption: "Выберите вариант"
    },
    roles: {
      player: "Игрок",
      club: "Клуб",
      organizer: "Организатор",
      admin: "Администратор"
    },
    header: {
      changePassword: "Пароль",
      logout: "Выйти"
    },
    auth: {
      signinTitle: "Вход",
      signupTitle: "Регистрация",
      signinSubtitle: "Доступ к турнирной и клубной экосистеме",
      signupSubtitle: "Создайте профиль, чтобы участвовать и управлять активностью на сайте",
      identifierPlaceholder: "Телефон или Email",
      passwordPlaceholder: "Пароль",
      signinAction: "Войти",
      orDivider: "или",
      forgotLink: "Забыли пароль?",
      createAccountLink: "Создать аккаунт",
      signInFailed: "Не удалось войти",
      socialGoogle: "Войти через Google",
      socialApple: "Войти через Apple",
      socialFacebook: "Войти через Facebook",
      verifyTitle: "Подтверждение email",
      verifySubtitle: "Если токен не подставился автоматически, вставьте его вручную.",
      verifyTokenPlaceholder: "Токен подтверждения",
      verifyAction: "Подтвердить email",
      verifyFailed: "Не удалось подтвердить email",
      forgotTitle: "Восстановление доступа",
      forgotSubtitle: "Введите email, и мы отправим ссылку для сброса пароля.",
      forgotAction: "Отправить ссылку",
      forgotFailed: "Не удалось отправить запрос",
      resetTitle: "Сброс пароля",
      resetSubtitle: "Откройте ссылку из письма и задайте новый пароль.",
      resetTokenPlaceholder: "Токен сброса",
      newPasswordPlaceholder: "Новый пароль",
      confirmPasswordPlaceholder: "Подтвердите новый пароль",
      resetAction: "Сбросить пароль",
      resetFailed: "Не удалось сбросить пароль",
      resetSuccess: "Пароль обновлен. Теперь можно войти с новым паролем.",
      passwordsMismatch: "Пароли не совпадают",
      backToSignin: "Вернуться ко входу",
      signupFailed: "Не удалось зарегистрироваться",
      forgotSent: "Если аккаунт существует, письмо уже отправлено.",
      signupEmailSent: "Мы отправили ссылку для подтверждения email.",
      changePasswordTitle: "Смена пароля",
      changePasswordSubtitle: "Используйте текущий пароль, чтобы задать новый.",
      currentPasswordPlaceholder: "Текущий пароль",
      changePasswordAction: "Сменить пароль",
      changePasswordFailed: "Не удалось обновить пароль",
      changePasswordSuccess: "Пароль обновлен.",
      signupSimple: {
        eyebrow: "Регистрация",
        title: "Создать аккаунт",
        subtitle: "Только базовое. Сайт откроется сразу после входа.",
        firstNamePlaceholder: "Имя",
        lastNamePlaceholder: "Фамилия",
        phonePlaceholder: "Номер телефона",
        passwordPlaceholder: "Пароль",
        action: "Создать аккаунт",
        signinLink: "Уже есть аккаунт? Войти",
        failed: "Не удалось создать аккаунт"
      }
    },
    rankings: {
      sortByPoints: "Сортировать по очкам",
      sortByWins: "Сортировать по победам",
      headers: {
        points: "Очки"
      }
    },
    admin: {
      nav: {
        overview: "Обзор",
        tournaments: "Турниры",
        news: "Новости",
        clubs: "Клубы",
        users: "Пользователи",
        players: "Игроки",
        applications: "Заявки"
      },
      overview: {
        title: "Панель администратора",
        subtitle: "Управление сущностями платформы и модерация из единого слоя.",
        actionsTitle: "Разделы управления",
        news: "Новости",
        applications: "Заявки"
      },
      actions: {
        create: "Создать",
        save: "Сохранить",
        delete: "Удалить",
        approve: "Одобрить",
        reject: "Отклонить"
      },
      common: {
        verified: "Подтвержден",
        allStatuses: "Все статусы",
        selectCountry: "Выберите страну",
        selectCity: "Выберите город",
        selectClub: "Выберите клуб",
        selectDiscipline: "Выберите дисциплину"
      },
      users: {
        title: "Пользователи",
        subtitle: "Создавайте аккаунты, назначайте роли и управляйте верификацией.",
        empty: "Пользователи не найдены.",
        emailPlaceholder: "Email",
        passwordPlaceholder: "Пароль",
        deleteConfirm: "Удалить пользователя"
      },
      clubs: {
        title: "Клубы",
        subtitle: "Каталог клубов, расположение и контактные данные.",
        empty: "Клубы не найдены.",
        namePlaceholder: "Название клуба",
        addressPlaceholder: "Адрес",
        phonePlaceholder: "Телефон",
        telegramPlaceholder: "Telegram",
        tablesPlaceholder: "Количество столов",
        disciplinesPlaceholder: "Дисциплины через запятую",
        latPlaceholder: "Широта",
        lngPlaceholder: "Долгота",
        descriptionPlaceholder: "Описание клуба",
        deleteConfirm: "Удалить клуб"
      },
      tournaments: {
        title: "Турниры",
        subtitle: "Создавайте турниры, обновляйте статусы и корректируйте записи.",
        empty: "Турниры не найдены.",
        titlePlaceholder: "Название турнира",
        startsAtPlaceholder: "Дата и время начала",
        prizePoolPlaceholder: "Призовой фонд",
        participantsPlaceholder: "Количество участников",
        deleteConfirm: "Удалить турнир"
      },
      news: {
        title: "Новости",
        subtitle: "Редактирование публикаций и контентных карточек.",
        empty: "Новости не найдены.",
        titlePlaceholder: "Заголовок",
        slugPlaceholder: "Slug",
        contentPlaceholder: "Текст публикации",
        publishedAtPlaceholder: "Дата публикации",
        deleteConfirm: "Удалить новость"
      },
      applications: {
        title: "Заявки",
        subtitle: "Модерация заявок игроков на турниры.",
        empty: "Заявки не найдены.",
        pending: "На рассмотрении",
        approved: "Одобрено",
        rejected: "Отклонено"
      }
    },
    home: {
      sections: {
        tournamentsSubtitle: "Предстоящие, live и завершенные события собраны в одном потоке после входа.",
        rankingsSubtitle: "Отслеживайте текущую форму, очки и движение по таблице.",
        playersSubtitle: "Игроки, недавняя форма и быстрый доступ к каждой карточке профиля.",
        clubsSubtitle: "Каталог площадок, адреса, инфраструктура и турнирная активность.",
        newsSubtitle: "Обновления платформы, анонсы, результаты и контент событий.",
        mediaSubtitle: "Галереи, хайлайты и медиа-архив турниров."
      }
    },
    account: {
      defaultName: "Игрок",
      noPhone: "Телефон не указан",
      closeLabel: "Закрыть меню аккаунта",
      panelLabel: "Панель аккаунта",
      statuses: {
        draft: "\u0427\u0435\u0440\u043d\u043e\u0432\u0438\u043a",
        registration: "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f",
        live: "\u0418\u0434\u0435\u0442 \u0441\u0435\u0439\u0447\u0430\u0441",
        finished: "\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043d"
      },
      stats: {
        tournaments: "Турниры",
        wins: "Победы",
        winRate: "Winrate"
      },
      history: "История турниров",
      upcoming: "Предстоящие турниры",
      latestResults: "Последние результаты",
      emptyHistory: "История пока пуста",
      emptyUpcoming: "Предстоящих турниров пока нет",
      emptyResults: "Результатов пока нет",
      actions: {
        profile: "Профиль",
        history: "История",
        settings: "Настройки",
        logout: "Выйти"
      }
    },
    tournamentCenter: {
      actions: {
        participate: "\u0423\u0447\u0430\u0441\u0442\u0432\u043e\u0432\u0430\u0442\u044c",
        playersOnly: "\u041f\u043e\u0434\u0430\u0447\u0430 \u0437\u0430\u044f\u0432\u043a\u0438 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0430 \u0442\u043e\u043b\u044c\u043a\u043e \u0438\u0433\u0440\u043e\u043a\u0430\u043c.",
        registrationClosed: "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f \u0437\u0430\u043a\u0440\u044b\u0442\u0430.",
        alreadyApplied: "\u0417\u0430\u044f\u0432\u043a\u0430 \u0443\u0436\u0435 \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0430.",
        noSpots: "\u041c\u0435\u0441\u0442 \u043d\u0435\u0442.",
        levelRestricted: "\u041d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e \u043f\u043e \u0443\u0440\u043e\u0432\u043d\u044e."
      },
      management: {
        poolMetric: "Участники в пуле",
        approvedApplications: "Одобрено",
        pendingApplications: "На рассмотрении",
        prizePool: "Призовой фонд",
        tournamentSettings: "Настройки турнира",
        tournamentSettingsHint: "Изменения сохраняются в базе и сразу отображаются на публичной странице турнира.",
        structureLockedHint: "После генерации сетки структура турнира блокируется: размер сетки и формат больше нельзя менять.",
        publicSyncHint: "Призовой фонд, статус и регламент синхронизируются с публичным турнирным центром после сохранения.",
        publicDescriptionTitle: "Публичное описание турнира",
        registrationLabelTitle: "Публичный статус регистрации",
        regulationFormat: "Формат регламента",
        entryFeeLabel: "Призовой фонд / взнос",
        localeRu: "RU",
        localeUz: "UZ",
        localeEn: "EN",
        participationTerms: "Условия участия",
        restrictions: "Ограничения",
        notes: "Примечания",
        applicationsTitle: "Заявки и пул участников",
        applicationsHint: "Организаторы и администраторы могут модерировать заявки и сразу переносить одобренных игроков в пул сетки.",
        noApplications: "Для этого турнира пока нет заявок.",
        alreadyInPool: "Уже в пуле",
        addApprovedToPool: "Добавить в пул",
        addApprovedBatch: "Добавить одобренных",
        noApprovedParticipantsToAdd: "Нет одобренных игроков для добавления.",
        approvedParticipantsAdded: "Одобренные игроки добавлены в пул.",
        participantRemoved: "Участник удален из пула.",
        removeParticipantConfirm: "Удалить участника из пула",
        generateHint: "Сетка будет сгенерирована из текущего пула участников.",
        record: "Статистика",
        actions: "Действия",
        removeParticipant: "Удалить из пула",
        applicationApproved: "Заявка одобрена.",
        applicationRejected: "Заявка отклонена.",
        tournamentSaved: "Турнир обновлен.",
        errors: {
          applicationModerationLocked: "\u041f\u043e\u0441\u043b\u0435 \u0433\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u0438 \u0441\u0435\u0442\u043a\u0438 \u0437\u0430\u044f\u0432\u043a\u0438 \u0431\u043e\u043b\u044c\u0448\u0435 \u043d\u0435\u043b\u044c\u0437\u044f \u043c\u043e\u0434\u0435\u0440\u0438\u0440\u043e\u0432\u0430\u0442\u044c.",
          removeLocked: "После генерации сетки участников нельзя удалять.",
          structureLocked: "Структуру сетки нельзя менять после генерации.",
          bracketTooSmall: "Размер сетки меньше текущего пула участников.",
          finishedLocked: "Завершенные турниры нельзя редактировать.",
          poolFull: "Пул сетки уже заполнен."
        }
      }
    }
  },
  uz: {
    common: {
      language: "Til",
      platformTag: "Premium turnir ekotizimi",
      statuses: {
        draft: "Qoralama",
        registration: "Ro'yxat ochiq",
        live: "Jonli",
        finished: "Yakunlangan"
      },
      stats: {
        points: "Ball"
      }
    },
    nav: {
      home: "Bosh sahifa",
      tournaments: "Turnirlar",
      players: "O'yinchilar",
      rankings: "Reytinglar",
      clubs: "Klublar",
      news: "Yangiliklar",
      media: "Media",
      signin: "Kirish",
      signup: "Akkaunt yaratish"
    },
    forms: {
      password: "Parol",
      selectOption: "Variantni tanlang"
    },
    roles: {
      player: "O'yinchi",
      club: "Klub",
      organizer: "Tashkilotchi",
      admin: "Administrator"
    },
    header: {
      changePassword: "Parol",
      logout: "Chiqish"
    },
    auth: {
      signinTitle: "Kirish",
      signupTitle: "Ro'yxatdan o'tish",
      signinSubtitle: "Turnir va klub ekotizimiga kiring",
      signupSubtitle: "Saytda ishtirok etish va boshqarish uchun profil yarating",
      identifierPlaceholder: "Telefon yoki Email",
      passwordPlaceholder: "Parol",
      signinAction: "Kirish",
      orDivider: "yoki",
      forgotLink: "Parolni unutdingizmi?",
      createAccountLink: "Akkaunt yaratish",
      signInFailed: "Kirish amalga oshmadi",
      socialGoogle: "Google orqali kirish",
      socialApple: "Apple orqali kirish",
      socialFacebook: "Facebook orqali kirish",
      verifyTitle: "Email tasdiqlash",
      verifySubtitle: "Token avtomatik qo'yilmagan bo'lsa, uni qo'lda kiriting.",
      verifyTokenPlaceholder: "Tasdiqlash tokeni",
      verifyAction: "Emailni tasdiqlash",
      verifyFailed: "Emailni tasdiqlab bo'lmadi",
      forgotTitle: "Kirishni tiklash",
      forgotSubtitle: "Emailni kiriting, biz parolni tiklash havolasini yuboramiz.",
      forgotAction: "Havolani yuborish",
      forgotFailed: "Xat yuborilmadi",
      resetTitle: "Parolni tiklash",
      resetSubtitle: "Emaildagi havolani oching va yangi parolni kiriting.",
      resetTokenPlaceholder: "Tiklash tokeni",
      newPasswordPlaceholder: "Yangi parol",
      confirmPasswordPlaceholder: "Yangi parolni tasdiqlang",
      resetAction: "Parolni tiklash",
      resetFailed: "Parolni tiklab bo'lmadi",
      resetSuccess: "Parol yangilandi. Endi yangi parol bilan kirishingiz mumkin.",
      passwordsMismatch: "Parollar mos emas",
      backToSignin: "Kirishga qaytish",
      signupFailed: "Ro'yxatdan o'tib bo'lmadi",
      forgotSent: "Agar akkaunt mavjud bo'lsa, xat allaqachon yuborildi.",
      signupEmailSent: "Email tasdiqlash havolasi yuborildi.",
      changePasswordTitle: "Parolni almashtirish",
      changePasswordSubtitle: "Yangi parol qo'yish uchun joriy paroldan foydalaning.",
      currentPasswordPlaceholder: "Joriy parol",
      changePasswordAction: "Parolni almashtirish",
      changePasswordFailed: "Parolni yangilab bo'lmadi",
      changePasswordSuccess: "Parol yangilandi.",
      signupSimple: {
        eyebrow: "Ro'yxatdan o'tish",
        title: "Akkaunt yaratish",
        subtitle: "Faqat bazaviy ma'lumotlar. Kirgandan keyin sayt darhol ochiladi.",
        firstNamePlaceholder: "Ism",
        lastNamePlaceholder: "Familiya",
        phonePlaceholder: "Telefon raqami",
        passwordPlaceholder: "Parol",
        action: "Akkaunt yaratish",
        signinLink: "Akkauntingiz bormi? Kirish",
        failed: "Akkaunt yaratib bo'lmadi"
      }
    },
    rankings: {
      sortByPoints: "Ball bo'yicha saralash",
      sortByWins: "G'alabalar bo'yicha saralash",
      headers: {
        points: "Ball"
      }
    },
    admin: {
      nav: {
        overview: "Umumiy",
        tournaments: "Turnirlar",
        news: "Yangiliklar",
        clubs: "Klublar",
        users: "Foydalanuvchilar",
        players: "O'yinchilar",
        applications: "Arizalar"
      },
      overview: {
        title: "Admin paneli",
        subtitle: "Platforma ma'lumotlarini boshqarish va tezkor moderatsiya.",
        actionsTitle: "Boshqaruv bo'limlari",
        news: "Yangiliklar",
        applications: "Arizalar"
      },
      actions: {
        create: "Yaratish",
        save: "Saqlash",
        delete: "O'chirish",
        approve: "Tasdiqlash",
        reject: "Rad etish"
      },
      common: {
        verified: "Tasdiqlangan",
        allStatuses: "Barcha statuslar",
        selectCountry: "Mamlakatni tanlang",
        selectCity: "Shaharni tanlang",
        selectClub: "Klubni tanlang",
        selectDiscipline: "Yo'nalishni tanlang"
      },
      users: {
        title: "Foydalanuvchilar",
        subtitle: "Akkaunt yaratish, rollar va verifikatsiya.",
        empty: "Foydalanuvchilar topilmadi.",
        emailPlaceholder: "Email",
        passwordPlaceholder: "Parol",
        deleteConfirm: "Foydalanuvchini o'chirish"
      },
      clubs: {
        title: "Klublar",
        subtitle: "Klublar katalogi, joylashuv va kontakt ma'lumotlari.",
        empty: "Klublar topilmadi.",
        namePlaceholder: "Klub nomi",
        addressPlaceholder: "Manzil",
        phonePlaceholder: "Telefon",
        telegramPlaceholder: "Telegram",
        tablesPlaceholder: "Stollar soni",
        disciplinesPlaceholder: "Yo'nalishlar, vergul bilan",
        latPlaceholder: "Kenglik",
        lngPlaceholder: "Uzunlik",
        descriptionPlaceholder: "Klub tavsifi",
        deleteConfirm: "Klubni o'chirish"
      },
      tournaments: {
        title: "Turnirlar",
        subtitle: "Turnir yaratish, statuslar va tezkor tahrirlash.",
        empty: "Turnirlar topilmadi.",
        titlePlaceholder: "Turnir nomi",
        startsAtPlaceholder: "Boshlanish sanasi va vaqti",
        prizePoolPlaceholder: "Mukofot jamg'armasi",
        participantsPlaceholder: "Ishtirokchilar soni",
        deleteConfirm: "Turnirni o'chirish"
      },
      news: {
        title: "Yangiliklar",
        subtitle: "Nashrlar va kontent kartalarini boshqarish.",
        empty: "Yangiliklar topilmadi.",
        titlePlaceholder: "Sarlavha",
        slugPlaceholder: "Slug",
        contentPlaceholder: "Nashr matni",
        publishedAtPlaceholder: "Nashr vaqti",
        deleteConfirm: "Yangilikni o'chirish"
      },
      applications: {
        title: "Arizalar",
        subtitle: "O'yinchilar arizalarini moderatsiya qilish.",
        empty: "Arizalar topilmadi.",
        pending: "Ko'rib chiqilmoqda",
        approved: "Tasdiqlangan",
        rejected: "Rad etilgan"
      }
    },
    home: {
      sections: {
        tournamentsSubtitle: "Kirgandan keyin bo'ladigan, live va tugagan voqealar bitta oqimda.",
        rankingsSubtitle: "Joriy forma, ball va reytingdagi siljishni kuzating.",
        playersSubtitle: "O'yinchilar, forma va to'liq profilga tez o'tish.",
        clubsSubtitle: "Maydonlar katalogi, manzillar, infratuzilma va turnir faolligi.",
        newsSubtitle: "Platforma yangiliklari, e'lonlar, natijalar va turnir kontenti.",
        mediaSubtitle: "Galereyalar, haylaytlar va turnir media arxivi."
      }
    },
    account: {
      defaultName: "O'yinchi",
      noPhone: "Telefon ko'rsatilmagan",
      closeLabel: "Akkaunt menyusini yopish",
      panelLabel: "Akkaunt paneli",
      stats: {
        tournaments: "Turnirlar",
        wins: "G'alabalar",
        winRate: "Winrate"
      },
      history: "Turnirlar tarixi",
      upcoming: "Yaqin turnirlar",
      latestResults: "So'nggi natijalar",
      emptyHistory: "Tarix hozircha bo'sh",
      emptyUpcoming: "Yaqin turnirlar hozircha yo'q",
      emptyResults: "Natijalar hozircha yo'q",
      actions: {
        profile: "Profil",
        history: "Tarix",
        settings: "Sozlamalar",
        logout: "Chiqish"
      }
    },
    tournamentCenter: {
      tabs: {
        info: "Ma'lumot",
        grid: "Setka",
        participants: "Ishtirokchilar",
        schedule: "Jadval",
        results: "Natijalar",
        regulation: "Reglament"
      },
      heroRegister: "Ariza yuborish",
      actions: {
        participate: "Ishtirok etish",
        playersOnly: "Ariza faqat o'yinchi uchun ochiq.",
        registrationClosed: "Ro'yxat yopilgan.",
        alreadyApplied: "Ariza allaqachon yuborilgan.",
        noSpots: "Joy qolmagan.",
        levelRestricted: "Daraja bo'yicha mavjud emas."
      },
      formats: {
        singleElimination: "Bitta mag'lubiyat bilan chiqish",
        doubleElimination: "Ikki mag'lubiyat bilan chiqish",
        playersSuffix: "isht."
      },
      info: {
        title: "Ma'lumot",
        descriptionFallback: "Bu turnir sahifasi setka, ishtirokchilar, jadval, natijalar va reglamentni bitta markazda yig'adi.",
        status: "Status",
        format: "Format",
        participants: "Ishtirokchilar",
        rounds: "Raundlar",
        description: "Tavsif",
        club: "Klub",
        city: "Shahar",
        discipline: "Yo'nalish",
        organizer: "Tashkilotchi",
        registration: "Ro'yxatdan o'tish",
        dateTime: "Sana va vaqt",
        prizePool: "Mukofot jamg'armasi"
      },
      bracket: {
        title: "Setka",
        empty: "Setka hali shakllanmagan.",
        legend: "Legenda",
        upper: "Yuqori setka",
        lower: "Pastki setka",
        final: "Final",
        winnerTo: "G'olib ->",
        loserTo: "Yutqazgan ->",
        table: "Stol",
        bestOf: "BO",
        match: "Match",
        pending: "Kutilmoqda",
        ready: "Tayyor",
        live: "Live",
        upcoming: "Yaqin",
        finished: "Tugagan",
        bye: "BYE",
        byeWin: "BYE orqali avtomatik o'tish",
        grandFinal: "Grand final",
        upperRound: "Yuqori raund",
        lowerRound: "Pastki raund",
        round: "Raund"
      },
      placeholders: {
        tbd: "TBD"
      },
      participants: {
        title: "Ishtirokchilar",
        empty: "Ishtirokchilar ro'yxati hozircha bo'sh.",
        seed: "Seed",
        player: "O'yinchi",
        club: "Klub",
        city: "Shahar",
        rating: "Reyting",
        status: "Status",
        placement: "O'rin",
        openProfile: "Profil"
      },
      schedule: {
        title: "Jadval",
        empty: "Matchlar hali rejalashtirilmagan.",
        allStatuses: "Barcha statuslar",
        allTables: "Barcha stollar",
        allPhases: "Barcha bosqichlar",
        tableLabel: "Stol",
        statusLabel: "Status",
        phaseLabel: "Bosqich"
      },
      results: {
        title: "Natijalar",
        empty: "Yakuniy natijalar matchlar tugagandan keyin chiqadi.",
        place: "O'rin",
        player: "O'yinchi",
        club: "Klub",
        rating: "Reyting",
        label: "Natija"
      },
      regulation: {
        title: "Reglament",
        format: "Format",
        entryFee: "Kirish badali",
        discipline: "Yo'nalish",
        terms: "Ishtirok shartlari",
        restrictions: "Cheklovlar",
        notes: "Qo'shimcha izohlar"
      },
      regulationPresets: {
        entryIncluded: "Tashkilotchi paketiga kiritilgan",
        entryFree: "Bepul ishtirok",
        term1: "Faqat tasdiqlangan o'yinchilar yakuniy seedga kiradi.",
        term2: "O'yinchi birinchi chaqiriqdan oldin joyida bo'lishi kerak.",
        term3: "Tashkilotchi stol va start vaqtini tasdiqlaydi.",
        restriction1: "Kechikish texnik mag'lubiyatga olib kelishi mumkin.",
        restriction2: "Nosportiv xatti-harakat diskvalifikatsiyaga sabab bo'lishi mumkin.",
        note1: "Setka va jadval natijalar kiritilishi bilan yangilanadi.",
        note2: "Bahsli holatlar bosh hakam tomonidan hal qilinadi."
      },
      resultLabels: {
        winner: "G'olib",
        finalist: "Finalchi",
        semifinalist: "Yarim finalchi",
        thirdPlace: "3-o'rin",
        fourthPlace: "4-o'rin",
        participant: "Ishtirokchi"
      },
      participantStatuses: {
        active: "Turnirda",
        eliminated: "Chiqib ketgan",
        winner: "G'olib",
        finalist: "Finalchi",
        semifinalist: "Yarim finalchi"
      },
      management: {
        title: "Setkani boshqarish",
        subtitle: "Ishtirokchilar, setka generatsiyasi va match natijalarini jonli boshqarish.",
        back: "Turnirlarga qaytish",
        openPublicPage: "Turnir markazini ochish",
        poolTitle: "Ishtirokchilar puli",
        poolHint: "Faqat platformadagi haqiqiy o'yinchilarni qo'shing. Setka generatsiyasidan keyin pool yopiladi.",
        playerPlaceholder: "O'yinchini tanlang",
        seedPlaceholder: "Seed",
        addParticipant: "Setkaga qo'shish",
        participantAdded: "Ishtirokchi setkaga qo'shildi.",
        bracketActions: "Setka amallari",
        generate: "Setka yaratish",
        bracketGenerated: "Setka yaratildi.",
        alreadyGenerated: "Setka allaqachon yaratilgan.",
        minimumParticipants: "Generatsiya uchun kamida 2 ishtirokchi kerak.",
        noAvailablePlayers: "Barcha mavjud o'yinchilar allaqachon poolga qo'shilgan.",
        matchesTitle: "Matchlarni boshqarish",
        noMatches: "Matchlar setka yaratilgandan keyin paydo bo'ladi.",
        setStatus: "Statusni yangilash",
        submitResult: "Natijani saqlash",
        winner: "G'olib",
        selectWinner: "Match g'olibini tanlang.",
        selectPlayer: "Qo'shish uchun o'yinchini tanlang.",
        player1Score: "1-o'yinchi hisobi",
        player2Score: "2-o'yinchi hisobi",
        statusSaved: "Status yangilandi.",
        resultSaved: "Natija saqlandi.",
        rollback: "Natijani bekor qilish",
        rollbackConfirm: "Match natijasi bekor qilinsinmi? Ishtirokchilar reytingi qayta hisoblanadi va match qayta ochiladi.",
        rollbackDone: "Natija bekor qilindi.",
        champion: "Chempion",
        manage: "Boshqarish",
        myTournaments: "Mening turnirlarim",
        emptyOwn: "Hozircha boshqarish uchun turnirlaringiz yo'q.",
        poolMetric: "Pooldagi o'yinchilar",
        approvedApplications: "Tasdiqlangan",
        pendingApplications: "Ko'rib chiqilmoqda",
        prizePool: "Mukofot jamg'armasi",
        tournamentSettings: "Turnir sozlamalari",
        tournamentSettingsHint: "O'zgarishlar bazaga saqlanadi va public turnir sahifasida darhol ko'rinadi.",
        structureLockedHint: "Setka yaratilgandan keyin turnir strukturasi qotadi: o'lcham va format o'zgarmaydi.",
        publicSyncHint: "Mukofot jamg'armasi, status va reglament saqlangandan keyin public tournament center bilan sinxronlashadi.",
        publicDescriptionTitle: "Turnirning ommaviy tavsifi",
        registrationLabelTitle: "Ro'yxatdan o'tishning ommaviy holati",
        regulationFormat: "Reglament formati",
        entryFeeLabel: "To'lov / mukofot bloki",
        localeRu: "RU",
        localeUz: "UZ",
        localeEn: "EN",
        participationTerms: "Ishtirok shartlari",
        restrictions: "Cheklovlar",
        notes: "Eslatmalar",
        applicationsTitle: "Arizalar va ishtirokchilar puli",
        applicationsHint: "Tashkilotchi va admin arizalarni moderatsiya qilib, tasdiqlangan o'yinchilarni darhol poolga o'tkazishi mumkin.",
        noApplications: "Bu turnir uchun hozircha arizalar yo'q.",
        alreadyInPool: "Allaqachon poolda",
        addApprovedToPool: "Poolga qo'shish",
        addApprovedBatch: "Tasdiqlanganlarni qo'shish",
        noApprovedParticipantsToAdd: "Qo'shish uchun tasdiqlangan o'yinchilar yo'q.",
        approvedParticipantsAdded: "Tasdiqlangan o'yinchilar poolga qo'shildi.",
        participantRemoved: "Ishtirokchi pooldan olib tashlandi.",
        removeParticipantConfirm: "Ishtirokchini pooldan olib tashlash",
        generateHint: "Setka joriy ishtirokchilar puli asosida yaratiladi.",
        record: "Balans",
        actions: "Amallar",
        removeParticipant: "Pooldan olib tashlash",
        applicationApproved: "Ariza tasdiqlandi.",
        applicationRejected: "Ariza rad etildi.",
        tournamentSaved: "Turnir yangilandi.",
        errors: {
          minimumParticipants: "Setka yaratish uchun kamida 2 ishtirokchi kerak.",
          byeResultLocked: "BYE match uchun natijani qo'lda kiritib bo'lmaydi.",
          invalidWinner: "G'olib match ishtirokchilaridan biri bo'lishi kerak.",
          scoresRequired: "Ikkala hisob birga kiritilishi kerak.",
          tieNotAllowed: "Hisob teng bo'lishi mumkin emas.",
          winnerScoreMismatch: "G'olib ko'rsatilgan hisobga mos emas.",
          applicationModerationLocked: "Setka yaratilgandan keyin arizalarni moderatsiya qilib bo'lmaydi.",
          duplicateSeed: "Bu seed allaqachon band.",
          seedOutOfRange: "Seed setka o'lchami oralig'ida bo'lishi kerak.",
          removeLocked: "Setka yaratilgandan keyin ishtirokchilarni olib tashlab bo'lmaydi.",
          structureLocked: "Setka yaratilgandan keyin strukturani o'zgartirib bo'lmaydi.",
          bracketTooSmall: "Setka o'lchami joriy turnir poolidan kichik.",
          finishedLocked: "Yakunlangan turnirni tahrirlab bo'lmaydi.",
          poolFull: "Setka pooli to'lgan."
        }
      }
    }
  },
  en: {
    common: {
      language: "Language",
      platformTag: "Premium tournament ecosystem",
      statuses: {
        draft: "Draft",
        registration: "Registration",
        live: "Live",
        finished: "Finished"
      },
      stats: {
        points: "Points"
      }
    },
    nav: {
      home: "Home",
      tournaments: "Tournaments",
      players: "Players",
      rankings: "Rankings",
      clubs: "Clubs",
      news: "News",
      media: "Media",
      signin: "Sign in",
      signup: "Create account"
    },
    forms: {
      password: "Password",
      selectOption: "Select option"
    },
    roles: {
      player: "Player",
      club: "Club",
      organizer: "Organizer",
      admin: "Administrator"
    },
    header: {
      changePassword: "Password",
      logout: "Log out"
    },
    auth: {
      signinTitle: "Sign in",
      signupTitle: "Create account",
      signinSubtitle: "Access the tournament and club ecosystem",
      signupSubtitle: "Create a profile to participate and manage activity on the site",
      identifierPlaceholder: "Phone or Email",
      passwordPlaceholder: "Password",
      signinAction: "Sign in",
      orDivider: "or",
      forgotLink: "Forgot password?",
      createAccountLink: "Create account",
      signInFailed: "Sign in failed",
      socialGoogle: "Continue with Google",
      socialApple: "Continue with Apple",
      socialFacebook: "Continue with Facebook",
      verifyTitle: "Email verification",
      verifySubtitle: "If the token was not filled automatically, paste it manually.",
      verifyTokenPlaceholder: "Verification token",
      verifyAction: "Verify email",
      verifyFailed: "Verification failed",
      forgotTitle: "Recover access",
      forgotSubtitle: "Enter your email and we will send a password reset link.",
      forgotAction: "Send link",
      forgotFailed: "Request failed",
      resetTitle: "Reset password",
      resetSubtitle: "Open the link from your email and set a new password.",
      resetTokenPlaceholder: "Reset token",
      newPasswordPlaceholder: "New password",
      confirmPasswordPlaceholder: "Confirm new password",
      resetAction: "Reset password",
      resetFailed: "Reset failed",
      resetSuccess: "Password updated. You can now sign in with the new password.",
      passwordsMismatch: "Passwords do not match",
      backToSignin: "Back to sign in",
      signupFailed: "Sign up failed",
      forgotSent: "If the account exists, the email has already been sent.",
      signupEmailSent: "We sent a verification link to your email.",
      changePasswordTitle: "Change password",
      changePasswordSubtitle: "Use your current password to set a new one.",
      currentPasswordPlaceholder: "Current password",
      changePasswordAction: "Change password",
      changePasswordFailed: "Password update failed",
      changePasswordSuccess: "Password updated.",
      signupSimple: {
        eyebrow: "Sign up",
        title: "Create account",
        subtitle: "Only the basics. The site opens right after sign in.",
        firstNamePlaceholder: "First name",
        lastNamePlaceholder: "Last name",
        phonePlaceholder: "Phone number",
        passwordPlaceholder: "Password",
        action: "Create account",
        signinLink: "Already have an account? Sign in",
        failed: "Could not create account"
      }
    },
    rankings: {
      sortByPoints: "Sort by points",
      sortByWins: "Sort by wins",
      headers: {
        points: "Points"
      }
    },
    admin: {
      nav: {
        overview: "Overview",
        tournaments: "Tournaments",
        news: "News",
        clubs: "Clubs",
        users: "Users",
        players: "Players",
        applications: "Applications"
      },
      overview: {
        title: "Admin dashboard",
        subtitle: "Manage platform entities and moderation from one control layer.",
        actionsTitle: "Management areas",
        news: "News",
        applications: "Applications"
      },
      actions: {
        create: "Create",
        save: "Save",
        delete: "Delete",
        approve: "Approve",
        reject: "Reject"
      },
      common: {
        verified: "Verified",
        allStatuses: "All statuses",
        selectCountry: "Select country",
        selectCity: "Select city",
        selectClub: "Select club",
        selectDiscipline: "Select discipline"
      },
      users: {
        title: "Users",
        subtitle: "Create accounts, assign roles, and manage verification.",
        empty: "No users found.",
        emailPlaceholder: "Email",
        passwordPlaceholder: "Password",
        deleteConfirm: "Delete user"
      },
      clubs: {
        title: "Clubs",
        subtitle: "Club catalog, locations, and contact details.",
        empty: "No clubs found.",
        namePlaceholder: "Club name",
        addressPlaceholder: "Address",
        phonePlaceholder: "Phone",
        telegramPlaceholder: "Telegram",
        tablesPlaceholder: "Table count",
        disciplinesPlaceholder: "Disciplines, comma-separated",
        latPlaceholder: "Latitude",
        lngPlaceholder: "Longitude",
        descriptionPlaceholder: "Club description",
        deleteConfirm: "Delete club"
      },
      tournaments: {
        title: "Tournaments",
        subtitle: "Create tournaments, update statuses, and adjust entries.",
        empty: "No tournaments found.",
        titlePlaceholder: "Tournament title",
        startsAtPlaceholder: "Start date and time",
        prizePoolPlaceholder: "Prize pool",
        participantsPlaceholder: "Participant count",
        deleteConfirm: "Delete tournament"
      },
      news: {
        title: "News",
        subtitle: "Edit publications and content cards.",
        empty: "No news items found.",
        titlePlaceholder: "Title",
        slugPlaceholder: "Slug",
        contentPlaceholder: "Article content",
        publishedAtPlaceholder: "Publish date",
        deleteConfirm: "Delete news item"
      },
      applications: {
        title: "Applications",
        subtitle: "Moderate player applications for tournaments.",
        empty: "No applications found.",
        pending: "Pending",
        approved: "Approved",
        rejected: "Rejected"
      }
    },
    home: {
      sections: {
        tournamentsSubtitle: "Upcoming, live, and completed events are collected in one stream after sign in.",
        rankingsSubtitle: "Track current form, points, and movement across the table.",
        playersSubtitle: "Players, recent form, and quick access to every profile card.",
        clubsSubtitle: "Venue catalog, addresses, infrastructure, and tournament activity.",
        newsSubtitle: "Platform updates, announcements, results, and event content.",
        mediaSubtitle: "Galleries, highlights, and tournament media collections."
      }
    },
    account: {
      defaultName: "Player",
      noPhone: "Phone not specified",
      closeLabel: "Close account menu",
      panelLabel: "Account panel",
      stats: {
        tournaments: "Tournaments",
        wins: "Wins",
        winRate: "Winrate"
      },
      history: "Tournament history",
      upcoming: "Upcoming tournaments",
      latestResults: "Latest results",
      emptyHistory: "History is empty for now",
      emptyUpcoming: "No upcoming tournaments yet",
      emptyResults: "No results yet",
      actions: {
        profile: "Profile",
        history: "History",
        settings: "Settings",
        logout: "Log out"
      }
    },
    tournamentCenter: {
      tabs: {
        info: "Info",
        grid: "Grid",
        participants: "Participants",
        schedule: "Schedule",
        results: "Results",
        regulation: "Regulation"
      },
      heroRegister: "Register",
      actions: {
        participate: "Participate",
        playersOnly: "Only player accounts can submit an application.",
        registrationClosed: "Registration is closed.",
        alreadyApplied: "Application already submitted.",
        noSpots: "No spots left.",
        levelRestricted: "Level restricted."
      },
      formats: {
        singleElimination: "Single elimination",
        doubleElimination: "Double elimination",
        playersSuffix: "players"
      },
      info: {
        title: "Info",
        descriptionFallback: "This tournament page brings the bracket, participants, schedule, results, and regulation together in one center.",
        status: "Status",
        format: "Format",
        participants: "Participants",
        rounds: "Rounds",
        description: "Description",
        club: "Club",
        city: "City",
        discipline: "Discipline",
        organizer: "Organizer",
        registration: "Registration",
        dateTime: "Date and time",
        prizePool: "Prize pool"
      },
      bracket: {
        title: "Bracket",
        empty: "The bracket has not been generated yet.",
        legend: "Legend",
        upper: "Upper bracket",
        lower: "Lower bracket",
        final: "Final",
        winnerTo: "Winner ->",
        loserTo: "Loser ->",
        table: "Table",
        bestOf: "BO",
        match: "Match",
        pending: "Pending",
        ready: "Ready",
        live: "Live",
        upcoming: "Upcoming",
        finished: "Finished",
        bye: "BYE",
        byeWin: "Auto-advance by BYE",
        grandFinal: "Grand Final",
        upperRound: "Upper Round",
        lowerRound: "Lower Round",
        round: "Round"
      },
      placeholders: {
        tbd: "TBD"
      },
      participants: {
        title: "Participants",
        empty: "Participant list is empty for now.",
        seed: "Seed",
        player: "Player",
        club: "Club",
        city: "City",
        rating: "Rating",
        status: "Status",
        placement: "Placement",
        openProfile: "Profile"
      },
      schedule: {
        title: "Schedule",
        empty: "Matches are not scheduled yet.",
        allStatuses: "All statuses",
        allTables: "All tables",
        allPhases: "All phases",
        tableLabel: "Table",
        statusLabel: "Status",
        phaseLabel: "Phase"
      },
      results: {
        title: "Results",
        empty: "Final results appear as the bracket is completed.",
        place: "Place",
        player: "Player",
        club: "Club",
        rating: "Rating",
        label: "Result"
      },
      regulation: {
        title: "Regulation",
        format: "Format",
        entryFee: "Entry fee",
        discipline: "Discipline",
        terms: "Participation terms",
        restrictions: "Restrictions",
        notes: "Additional notes"
      },
      regulationPresets: {
        entryIncluded: "Included in the organizer package",
        entryFree: "Free entry",
        term1: "Only confirmed players are included in the final seeding.",
        term2: "Players must be present before the first scheduled call.",
        term3: "The organizer confirms tables and match start times.",
        restriction1: "Late arrival may result in a technical loss.",
        restriction2: "Unsportsmanlike conduct may lead to disqualification.",
        note1: "The bracket and schedule are updated as results are submitted.",
        note2: "Disputes are resolved by the chief referee."
      },
      resultLabels: {
        winner: "Winner",
        finalist: "Finalist",
        semifinalist: "Semifinalist",
        thirdPlace: "3rd place",
        fourthPlace: "4th place",
        participant: "Participant"
      },
      participantStatuses: {
        active: "Active",
        eliminated: "Eliminated",
        winner: "Winner",
        finalist: "Finalist",
        semifinalist: "Semifinalist"
      },
      management: {
        title: "Bracket management",
        subtitle: "Live management for participants, bracket generation, and match results.",
        back: "Back to tournaments",
        openPublicPage: "Open tournament center",
        poolTitle: "Participant pool",
        poolHint: "Add only real platform players. The pool becomes locked after bracket generation.",
        playerPlaceholder: "Select player",
        seedPlaceholder: "Seed",
        addParticipant: "Add to bracket",
        participantAdded: "Participant added to the bracket.",
        bracketActions: "Bracket actions",
        generate: "Generate bracket",
        bracketGenerated: "Bracket generated.",
        alreadyGenerated: "The bracket has already been generated.",
        minimumParticipants: "At least 2 participants are required to generate a bracket.",
        noAvailablePlayers: "All available players have already been added to the bracket pool.",
        matchesTitle: "Match management",
        noMatches: "Matches appear after the bracket is generated.",
        setStatus: "Update status",
        submitResult: "Save result",
        winner: "Winner",
        selectWinner: "Select a match winner.",
        selectPlayer: "Select a player to add.",
        player1Score: "Player 1 score",
        player2Score: "Player 2 score",
        statusSaved: "Status updated.",
        resultSaved: "Result saved.",
        rollback: "Roll back result",
        rollbackConfirm: "Roll back this match result? Participant ratings will be recalculated and the match will reopen for entry.",
        rollbackDone: "Result rolled back.",
        champion: "Champion",
        manage: "Manage",
        myTournaments: "My tournaments",
        emptyOwn: "You do not have tournaments to manage yet.",
        poolMetric: "Players in pool",
        approvedApplications: "Approved",
        pendingApplications: "Pending",
        prizePool: "Prize pool",
        tournamentSettings: "Tournament settings",
        tournamentSettingsHint: "Changes are stored in the database and reflected on the public tournament page.",
        structureLockedHint: "After bracket generation the tournament structure is locked: bracket size and format can no longer change.",
        publicSyncHint: "Prize pool, status, and regulation sync to the public tournament center after save.",
        publicDescriptionTitle: "Public tournament description",
        registrationLabelTitle: "Public registration label",
        regulationFormat: "Regulation format",
        entryFeeLabel: "Entry / prize block",
        localeRu: "RU",
        localeUz: "UZ",
        localeEn: "EN",
        participationTerms: "Participation terms",
        restrictions: "Restrictions",
        notes: "Notes",
        applicationsTitle: "Applications and participant pool",
        applicationsHint: "Organizers and admins can moderate applications and move approved players into the bracket pool immediately.",
        noApplications: "There are no applications for this tournament yet.",
        alreadyInPool: "Already in pool",
        addApprovedToPool: "Add to pool",
        addApprovedBatch: "Add approved players",
        noApprovedParticipantsToAdd: "There are no approved players to add.",
        approvedParticipantsAdded: "Approved players were added to the pool.",
        participantRemoved: "Participant removed from the pool.",
        removeParticipantConfirm: "Remove participant from pool",
        generateHint: "The bracket will be generated from the current participant pool.",
        record: "Record",
        actions: "Actions",
        removeParticipant: "Remove from pool",
        applicationApproved: "Application approved.",
        applicationRejected: "Application rejected.",
        tournamentSaved: "Tournament updated.",
        errors: {
          minimumParticipants: "At least 2 participants are required to generate a bracket.",
          byeResultLocked: "Manual result entry is not allowed for BYE matches.",
          invalidWinner: "Winner must be one of the match participants.",
          scoresRequired: "Both scores must be provided together.",
          tieNotAllowed: "Scores cannot be tied.",
          winnerScoreMismatch: "Winner does not match the provided score.",
          applicationModerationLocked: "Applications cannot be moderated after bracket generation.",
          duplicateSeed: "That seed is already occupied in this bracket.",
          seedOutOfRange: "Seed must stay within the bracket size.",
          removeLocked: "Participants cannot be removed after bracket generation.",
          structureLocked: "Bracket structure cannot be changed after generation.",
          bracketTooSmall: "Bracket size is smaller than the current tournament pool.",
          finishedLocked: "Finished tournament cannot be edited.",
          poolFull: "The bracket pool is already full."
        }
      }
    }
  }
};
