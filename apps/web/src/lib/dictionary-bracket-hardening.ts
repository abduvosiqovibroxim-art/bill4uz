import type { Locale } from "./types";

export const dictionaryBracketHardening: Record<Locale, Record<string, unknown>> = {
  ru: {
    admin: {
      tournaments: {
        createAction: "Создать турнир"
      }
    },
    forms: {
      selectOption: "Выберите вариант"
    },
    tournamentCenter: {
      tabs: {
        info: "Информация",
        grid: "Сетка",
        participants: "Участники",
        schedule: "Расписание",
        results: "Результаты",
        regulation: "Регламент"
      },
      heroRegister: "Подать заявку",
      formats: {
        singleElimination: "Олимпийская система",
        doubleElimination: "Двойное выбывание",
        playersSuffix: "уч."
      },
      info: {
        title: "Информация",
        descriptionFallback: "Эта страница турнира объединяет сетку, участников, расписание, результаты и регламент в одном центре.",
        status: "Статус",
        format: "Формат",
        participants: "Участники",
        rounds: "Раунды",
        description: "Описание",
        club: "Клуб",
        city: "Город",
        discipline: "Дисциплина",
        organizer: "Организатор",
        registration: "Регистрация",
        dateTime: "Дата и время",
        prizePool: "Призовой фонд"
      },
      bracket: {
        title: "Сетка",
        empty: "Сетка ещё не сформирована.",
        legend: "Легенда",
        upper: "Верхняя сетка",
        lower: "Нижняя сетка",
        final: "Финал",
        winnerTo: "Победитель ->",
        loserTo: "Проигравший ->",
        table: "Стол",
        bestOf: "BO",
        match: "Матч",
        matchShort: "М",
        pending: "Ожидание",
        ready: "Готов",
        live: "В игре",
        upcoming: "Скоро",
        finished: "Завершён",
        bye: "BYE",
        byeWin: "Проход по BYE",
        grandFinal: "Гранд-финал",
        upperRound: "Раунд верхней сетки",
        lowerRound: "Раунд нижней сетки",
        round: "Раунд"
      },
      placeholders: {
        tbd: "Определяется"
      },
      participants: {
        title: "Участники",
        empty: "Список участников пока пуст.",
        seed: "Seed",
        player: "Игрок",
        club: "Клуб",
        city: "Город",
        rating: "Рейтинг",
        status: "Статус",
        placement: "Место",
        openProfile: "Профиль"
      },
      schedule: {
        title: "Расписание",
        empty: "Матчи ещё не запланированы.",
        allStatuses: "Все статусы",
        allTables: "Все столы",
        allPhases: "Все фазы",
        tableLabel: "Стол",
        statusLabel: "Статус",
        phaseLabel: "Фаза"
      },
      results: {
        title: "Результаты",
        empty: "Итоговые результаты появятся по мере завершения сетки.",
        place: "Место",
        player: "Игрок",
        club: "Клуб",
        rating: "Рейтинг",
        label: "Результат"
      },
      regulation: {
        title: "Регламент",
        format: "Формат",
        entryFee: "Вступительный взнос",
        discipline: "Дисциплина",
        terms: "Условия участия",
        restrictions: "Ограничения",
        notes: "Дополнительные примечания",
        empty: "Раздел регламента ещё не заполнен."
      },
      regulationPresets: {
        entryIncluded: "Включено в пакет организатора",
        entryFree: "Бесплатное участие",
        term1: "В итоговый посев включаются только подтверждённые игроки.",
        term2: "Игрок должен быть на месте до первого назначенного вызова.",
        term3: "Организатор подтверждает столы и время начала матчей.",
        restriction1: "Опоздание может привести к техническому поражению.",
        restriction2: "Неспортивное поведение может повлечь дисквалификацию.",
        note1: "Сетка и расписание обновляются по мере внесения результатов.",
        note2: "Все спорные ситуации решает главный судья."
      },
      resultLabels: {
        winner: "Победитель",
        finalist: "Финалист",
        semifinalist: "Полуфиналист",
        thirdPlace: "3-е место",
        fourthPlace: "4-е место",
        participant: "Участник"
      },
      participantStatuses: {
        active: "В турнире",
        eliminated: "Выбыл",
        winner: "Победитель",
        finalist: "Финалист",
        semifinalist: "Полуфиналист"
      },
      management: {
        title: "Управление сеткой",
        subtitle: "Оперативное управление участниками, формированием сетки и результатами матчей.",
        back: "Назад к турнирам",
        openPublicPage: "Открыть центр турнира",
        poolTitle: "Пул участников",
        poolHint: "Добавляйте только реальных игроков платформы. После формирования сетки пул закрывается.",
        playerPlaceholder: "Выберите игрока",
        seedPlaceholder: "Номер посева",
        addParticipant: "Добавить в сетку",
        participantAdded: "Участник добавлен в сетку.",
        noAvailablePlayers: "Доступных игроков для добавления не осталось.",
        bracketActions: "Действия с сеткой",
        generate: "Сформировать сетку",
        bracketGenerated: "Сетка успешно сформирована.",
        alreadyGenerated: "Сетка уже сформирована.",
        minimumParticipants: "Для формирования сетки требуется 2 участника.",
        matchesTitle: "Управление матчами",
        noMatches: "Матчи появятся после формирования сетки.",
        setStatus: "Обновить статус",
        submitResult: "Сохранить результат",
        winner: "Победитель",
        player1Score: "Счёт игрока 1",
        player2Score: "Счёт игрока 2",
        statusSaved: "Статус обновлён.",
        resultSaved: "Результат сохранён.",
        rollback: "Откатить результат",
        rollbackConfirm: "Откатить результат матча? Рейтинг участников будет пересчитан, а матч снова откроется для ввода.",
        rollbackDone: "Результат откатан.",
        champion: "Чемпион",
        manage: "Управлять",
        myTournaments: "Мои турниры",
        emptyOwn: "У вас пока нет турниров для управления.",
        selectPlayer: "Выберите игрока для добавления.",
        selectWinner: "Выберите победителя матча.",
        errors: {
          selectPlayer: "Выберите игрока для добавления.",
          selectWinner: "Выберите победителя матча.",
          minimumParticipants: "Требуется 2 участника как минимум для формирования сетки.",
          byeResultLocked: "Для матчей с BYE ручной ввод результата недоступен.",
          invalidWinner: "Победителем должен быть один из участников матча.",
          scoresRequired: "Оба счёта должны быть указаны вместе.",
          tieNotAllowed: "Счёт не может быть равным.",
          winnerScoreMismatch: "Победитель должен соответствовать большему счёту.",
          duplicateSeed: "Seed должен быть уникальным в рамках турнира.",
          seedOutOfRange: "Seed должен быть в диапазоне размера сетки."
        }
      }
    }
  },
  uz: {
    admin: {
      tournaments: {
        createAction: "Turnir yaratish"
      }
    },
    forms: {
      selectOption: "Variantni tanlang"
    },
    tournamentCenter: {
      info: {
        status: "Holat",
        format: "Format",
        prizePool: "Mukofot jamg'armasi"
      },
      bracket: {
        match: "Bellashuv",
        matchShort: "B",
        live: "Jonli"
      },
      placeholders: {
        tbd: "Aniqlanadi"
      },
      participants: {
        seed: "Saralash",
        status: "Holat"
      },
      schedule: {
        empty: "Bellashuvlar hali rejalashtirilmagan.",
        allStatuses: "Barcha holatlar",
        statusLabel: "Holat"
      },
      regulation: {
        format: "Format",
        empty: "Reglament bo'limi hali to'ldirilmagan."
      },
      management: {
        poolTitle: "Ishtirokchilar ro'yxati",
        poolHint: "Faqat platformadagi haqiqiy o'yinchilarni qo'shing. Setka yaratilgach ro'yxat yopiladi.",
        seedPlaceholder: "Saralash raqami",
        matchesTitle: "Bellashuvlarni boshqarish",
        noMatches: "Bellashuvlar setka yaratilgandan keyin paydo bo'ladi.",
        setStatus: "Holatni yangilash",
        participantAdded: "Ishtirokchi setkaga qo'shildi.",
        bracketGenerated: "Setka muvaffaqiyatli yaratildi.",
        noAvailablePlayers: "Qo'shish uchun bo'sh o'yinchilar qolmadi.",
        selectPlayer: "Qo'shish uchun o'yinchini tanlang.",
        selectWinner: "Bellashuv g'olibini tanlang.",
        errors: {
          selectPlayer: "Qo'shish uchun o'yinchini tanlang.",
          selectWinner: "Bellashuv g'olibini tanlang.",
          minimumParticipants: "Setka yaratish uchun kamida 2 ishtirokchi kerak.",
          byeResultLocked: "BYE bellashuvida natijani qo'lda kiritib bo'lmaydi.",
          invalidWinner: "G'olib bellashuv ishtirokchilaridan biri bo'lishi kerak.",
          scoresRequired: "Har ikki hisob birga yuborilishi kerak.",
          tieNotAllowed: "Hisob teng bo'lishi mumkin emas.",
          winnerScoreMismatch: "G'olib yuqoriroq hisobga mos bo'lishi kerak.",
          duplicateSeed: "Saralash raqami turnir ichida yagona bo'lishi kerak.",
          seedOutOfRange: "Saralash raqami setka diapazonida bo'lishi kerak."
        }
      }
    }
  },
  en: {
    forms: {
      selectOption: "Select an option"
    },
    tournamentCenter: {
      bracket: {
        matchShort: "M"
      },
      placeholders: {
        tbd: "Awaiting player"
      },
      regulation: {
        empty: "This regulation section has not been filled yet."
      },
      management: {
        errors: {
          selectPlayer: "Select a player before adding them to the bracket.",
          selectWinner: "Select a winner before submitting the result.",
          minimumParticipants: "At least 2 participants are required to generate a bracket.",
          byeResultLocked: "Manual result entry is not allowed for BYE matches.",
          invalidWinner: "Winner must be one of the match participants.",
          scoresRequired: "Both player scores must be provided together.",
          tieNotAllowed: "Scores cannot be tied.",
          winnerScoreMismatch: "Winner must correspond to the higher score.",
          duplicateSeed: "Seed must be unique within the tournament.",
          seedOutOfRange: "Seed must be between 1 and the bracket size."
        },
        participantAdded: "Participant added to the bracket.",
        bracketGenerated: "Bracket generated successfully.",
        noAvailablePlayers: "No available players remain to add to the bracket.",
        selectPlayer: "Select a player before adding them to the bracket.",
        selectWinner: "Select a winner before submitting the result."
      }
    },
    admin: {
      tournaments: {
        createAction: "Create tournament"
      }
    }
  }
};
