import type { Locale } from "./types";

export const dictionaryAuditPass: Record<Locale, Record<string, unknown>> = {
  ru: {
    common: {
      language: "Язык",
      platformTag: "Премиальная турнирная экосистема",
      appDescription: "Цифровая платформа для клубов, турниров, игроков и рейтингов Узбекистана.",
      readMore: "Подробнее",
      details: "Открыть",
      all: "Все",
      noResults: "По текущим фильтрам ничего не найдено.",
      stats: {
        wins: "Победы",
        losses: "Поражения",
        winRate: "Процент побед",
        rating: "Рейтинг",
        tables: "Столы",
        prizePool: "Призовой фонд",
        participants: "Участники",
        organizer: "Организатор",
        format: "Формат",
        address: "Адрес",
        club: "Клуб",
        date: "Дата",
        city: "Город",
        country: "Страна",
        disciplines: "Дисциплины",
        services: "Услуги",
        workHours: "Часы работы",
        points: "Очки"
      },
      statuses: {
        upcoming: "Скоро",
        draft: "Черновик",
        registration: "Регистрация",
        live: "Идет сейчас",
        finished: "Завершен"
      },
      categories: {
        platform: "Платформа",
        tournament: "Турнир",
        product: "Продукт",
        media: "Медиа"
      },
      cities: {
        tashkent: "Ташкент",
        samarkand: "Самарканд",
        bukhara: "Бухара",
        andijan: "Андижан",
        namangan: "Наманган",
        fergana: "Фергана",
        nukus: "Нукус"
      },
      countries: {
        uzbekistan: "Узбекистан"
      },
      disciplines: {
        freePyramid: "Свободная пирамида",
        russianPyramid: "Русская пирамида"
      },
      services: {
        academy: "Академия",
        vip: "VIP-зал",
        coaching: "Тренер",
        stream: "Трансляция"
      },
      mediaTypes: {
        highlights: "Хайлайты",
        report: "Репортаж",
        interview: "Интервью"
      },
      localeNames: {
        ru: "Рус",
        uz: "Узб",
        en: "Eng"
      }
    },
    nav: {
      home: "Главная",
      tournaments: "Турниры",
      players: "Игроки",
      rankings: "Рейтинги",
      clubs: "Бильярдные",
      news: "Новости",
      media: "Медиа",
      about: "О платформе",
      contacts: "Контакты",
      signin: "Войти",
      signup: "Регистрация"
    },
    commonUi: {
      loading: "Загрузка",
      retry: "Повторить",
      backHome: "На главную",
      exploreTournaments: "Смотреть турниры",
      followLive: "Следить в live",
      openTournamentCenter: "Открыть турнир",
      seeProfile: "Смотреть профиль",
      seeClub: "Смотреть место",
      seeAllNews: "Все новости",
      discoverMedia: "Открыть медиа",
      seeAllPlayers: "Все игроки",
      seeAllClubs: "Все бильярдные"
    },
    home: {
      eyebrow: "Бильярдная экосистема Узбекистана",
      ctaTournament: "Создать турнир",
      tournamentsTitle: "Ближайшие турниры",
      sections: {
        tournamentsSubtitle: "Актуальные события по городам и бильярдным",
        rankingsSubtitle: "Национальный рейтинг по текущей форме, очкам и стабильности сезона.",
        playersSubtitle: "Игроки, форма и быстрый доступ к профилям.",
        clubsSubtitle: "Бильярдные с инфраструктурой, контактами и турнирной активностью.",
        newsSubtitle: "Обновления платформы, анонсы, результаты и контент турниров.",
        mediaSubtitle: "Галереи, хайлайты и медиаархив турниров."
      },
      showcase: {
        heroTitle: "Живая платформа для бильярдных турниров, клубов и рейтингов",
        heroSubtitle:
          "Bill4 объединяет публичные страницы турниров, live-сетки, игроков, бронирование, новости и кабинеты организаторов в одном продукте.",
        liveNow: "Идет сейчас",
        stage: "Стадия",
        matchesPlayed: "Сыграно матчей",
        matchesRemaining: "Осталось матчей",
        latestChampion: "Последний чемпион",
        awaitingFinal: "Чемпион определится после финала",
        championFallback: "Финал еще не закрыт, но сетка и результаты уже доступны публично.",
        featuredPlayerTitle: "Игрок недели",
        featuredClubTitle: "Место недели",
        semifinalStage: "Полуфинал",
        quarterfinalStage: "Четвертьфинал",
        mainBracketStage: "Основная сетка",
        liveControlEyebrow: "Live-центр",
        liveControlTitle: "Что происходит на платформе прямо сейчас",
        liveControlSubtitle: "Live-турниры, последние обновления, свежий чемпион и медиаистории в одном блоке.",
        liveTrackerEmpty: "Сейчас нет активного live-матча, но ближайшие сетки уже опубликованы.",
        latestUpdate: "Последнее обновление",
        awaitingLive: "Ожидается следующий live-матч",
        latestUpdateFallback: "Как только матч перейдет в LIVE или FINISHED, он появится здесь.",
        recentUpdatesTitle: "Последние обновления",
        mediaTitle: "Медиа и хайлайты",
        mediaFallback: "Эта галерея уже подключена к публичным данным платформы.",
        assets: "материалов",
        howItWorksEyebrow: "Как это работает",
        howItWorksTitle: "От заявки до чемпиона",
        howItWorksSubtitle:
          "Платформа соединяет регистрацию, публичную страницу турнира, live-обновления и кабинет управления в один поток.",
        steps: {
          applyTitle: "Игрок подает заявку",
          applyText: "Регистрация, участие и попадание в сетку проходят через единую систему игроков и ролей.",
          trackTitle: "Зритель следит за ходом турнира",
          trackText: "Страница турнира без входа показывает информацию, сетку, участников, расписание, результаты и регламент.",
          manageTitle: "Организатор управляет турниром",
          manageText: "Кабинет позволяет вести участников, генерировать сетку, менять статусы матчей и закрывать финал."
        },
        audiencesEyebrow: "Для кого",
        audiencesTitle: "Одна платформа для игроков, бронирования и организаторов",
        audiencesSubtitle: "У каждой роли свой сценарий, а публичные страницы и данные остаются едиными.",
        audiencePlayersTitle: "Для игроков",
        audiencePlayersText: "Рейтинг, история турниров, профиль и быстрый доступ к активным событиям в одном месте.",
        audienceClubsTitle: "Для бронирования",
        audienceClubsText: "Бильярдные места, контакты, столы и маршрут для гостей.",
        audienceOrganizersTitle: "Для организаторов",
        audienceOrganizersText: "Защищенный кабинет для управления сеткой, участниками и результатами.",
        nextToStart: "Скоро стартуют",
        upcomingSubtitle: "Ближайшие турниры уже готовы для просмотра, регистрации и публикации."
      }
    },
    tournaments: {
      title: "Турниры",
      subtitle: "Расписание, статусы, быстрые фильтры и карточки событий",
      cityPlaceholder: "Все города",
      statusPlaceholder: "Все статусы",
      disciplinePlaceholder: "Все дисциплины",
      clubsCount: "Бильярдных в каталоге",
      empty: "По выбранным параметрам турниры не найдены."
    },
    clubs: {
      title: "Бильярдные",
      subtitle: "Проверенные бильярдные места, готовые к картам и бронированию.",
      cityPlaceholder: "Все города",
      servicesPlaceholder: "Все услуги",
      searchPlaceholder: "Найти бильярдную",
      networkCities: "Города сети",
      profile: {
        description: "О бильярдной"
      }
    },
    players: {
      title: "Игроки",
      subtitle: "Каталог с поиском, сортировкой и статистикой игроков",
      searchPlaceholder: "Найти игрока",
      cityPlaceholder: "Все города",
      sortByElo: "ELO по убыванию",
      sortByWins: "Больше всего побед",
      achievements: "Достижения",
      history: "История турниров",
      profile: {
        bio: "Профиль игрока"
      }
    },
    rankings: {
      title: "Рейтинги",
      subtitle: "Общая таблица, дисциплины и региональные срезы",
      disciplinesAll: "Общий рейтинг",
      regionsAll: "Все регионы",
      searchPlaceholder: "Найти игрока",
      sortByElo: "Сортировать по ELO",
      sortByWins: "Сортировать по победам",
      sortByPoints: "Сортировать по очкам",
      headers: {
        place: "#",
        player: "Игрок",
        city: "Город",
        elo: "ELO",
        winRate: "Процент побед",
        points: "Очки"
      }
    },
    roles: {
      player: "Игрок",
      club: "Клуб",
      organizer: "Организатор",
      admin: "Администратор"
    },
    auth: {
      signinTitle: "Вход",
      signupTitle: "Регистрация",
      signinSubtitle: "Вход в турнирную и клубную экосистему",
      signupSubtitle: "Создайте профиль для участия, публикации и управления активностью на сайте",
      identifierPlaceholder: "Телефон или Email",
      passwordPlaceholder: "Пароль",
      signinAction: "Войти",
      orDivider: "или",
      forgotLink: "Забыли пароль?",
      createAccountLink: "Создать аккаунт",
      signInFailed: "Не удалось выполнить вход",
      socialGoogle: "Продолжить через Google",
      socialApple: "Продолжить через Apple",
      socialFacebook: "Продолжить через Facebook",
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
      signupSimple: {
        eyebrow: "Регистрация",
        title: "Создать аккаунт",
        subtitle: "Только базовые данные. После входа сайт откроется сразу.",
        firstNamePlaceholder: "Имя",
        lastNamePlaceholder: "Фамилия",
        phonePlaceholder: "Номер телефона",
        passwordPlaceholder: "Пароль",
        action: "Создать аккаунт",
        signinLink: "Уже есть аккаунт? Войти",
        failed: "Не удалось создать аккаунт"
      }
    },
    admin: {
      nav: {
        clubs: "Бильярдные"
      },
      common: {
        selectCity: "Выберите город",
        selectClub: "Выберите бильярдную"
      },
      clubs: {
        title: "Бильярдные",
        subtitle: "Бильярдные места, адреса, столы и контактные данные.",
        empty: "Бильярдные пока не добавлены.",
        namePlaceholder: "Название бильярдной",
        descriptionPlaceholder: "Описание бильярдной",
        deleteConfirm: "Удалить бильярдную"
      }
    },
    tournamentCenter: {
      bracket: {
        final: "Финал",
        match: "Матч",
        pending: "Ожидается",
        ready: "Готов",
        live: "Идет",
        upcoming: "Скоро",
        finished: "Завершен"
      },
      placeholders: {
        tbd: "Ожидается игрок"
      },
      info: {
        dateTime: "Дата и время"
      }
    },
    system: {
      errorTitle: "Что-то пошло не так",
      errorText: "Попробуйте еще раз или обратитесь в поддержку, если ошибка повторяется.",
      notFoundTitle: "Страница не найдена",
      notFoundText: "Запрошенный раздел не существует или был перемещен."
    }
  },
  uz: {
    admin: {
      nav: {
        clubs: "Bilyard joylari"
      },
      common: {
        selectClub: "Bilyard joyini tanlang"
      },
      clubs: {
        title: "Bilyard joylari",
        subtitle: "Bilyard joylari, manzillar, stollar va kontaktlar.",
        empty: "Bilyard joylari hali qo'shilmagan.",
        namePlaceholder: "Bilyard joyi nomi",
        descriptionPlaceholder: "Bilyard joyi tavsifi",
        deleteConfirm: "Bilyard joyini o'chirish"
      }
    }
  },
  en: {
    admin: {
      nav: {
        clubs: "Billiard places"
      },
      common: {
        selectClub: "Select billiard place"
      },
      clubs: {
        title: "Billiard places",
        subtitle: "Billiard places, addresses, tables, and contact details.",
        empty: "No billiard places added yet.",
        namePlaceholder: "Billiard place name",
        descriptionPlaceholder: "Billiard place description",
        deleteConfirm: "Delete billiard place"
      }
    }
  }
};
