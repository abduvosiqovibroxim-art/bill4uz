import type { Locale } from "./types";

export const dictionaryBracketHardening: Record<Locale, Record<string, unknown>> = {
  ru: {
    admin: {
      tournaments: {
        createAction: "������� ������"
      }
    },
    forms: {
      selectOption: "�������� ��������"
    },
    tournamentCenter: {
      tabs: {
        info: "����������",
        grid: "�����",
        participants: "���������",
        schedule: "����������",
        results: "����������",
        regulation: "���������"
      },
      heroRegister: "������ ������",
      formats: {
        singleElimination: "��������� ���������",
        doubleElimination: "������� ���������",
        playersSuffix: "��."
      },
      info: {
        title: "����������",
        descriptionFallback: "��� ��������� �������� �������� � ����� ����� �����, ����������, ����������, ���������� � ���������.",
        status: "������",
        format: "������",
        participants: "���������",
        rounds: "������",
        description: "��������",
        club: "����",
        city: "�����",
        discipline: "����������",
        organizer: "�����������",
        registration: "�����������",
        dateTime: "���� � �����",
        prizePool: "�������� ����"
      },
      bracket: {
        title: "�����",
        empty: "����� ���� �� ������������.",
        legend: "�������",
        upper: "������� �����",
        lower: "������ �����",
        final: "�����",
        winnerTo: "���������� ->",
        loserTo: "����������� ->",
        table: "����",
        bestOf: "BO",
        match: "����",
        matchShort: "�",
        pending: "��������",
        ready: "�����",
        live: "� ����",
        upcoming: "�����",
        finished: "��������",
        bye: "BYE",
        byeWin: "���������� �� BYE",
        grandFinal: "�����-�����",
        upperRound: "������� �����",
        lowerRound: "������ �����",
        round: "�����"
      },
      placeholders: {
        tbd: "���������"
      },
      participants: {
        title: "���������",
        empty: "������ ���������� ���� ����.",
        seed: "Seed",
        player: "�����",
        club: "����",
        city: "�����",
        rating: "�������",
        status: "������",
        placement: "�����",
        openProfile: "�������"
      },
      schedule: {
        title: "����������",
        empty: "����� ���� �� �������������.",
        allStatuses: "��� �������",
        allTables: "��� �����",
        allPhases: "��� �����",
        tableLabel: "����",
        statusLabel: "������",
        phaseLabel: "����"
      },
      results: {
        title: "����������",
        empty: "�������� ���������� �������� ����� ���������� ������.",
        place: "�����",
        player: "�����",
        club: "����",
        rating: "�������",
        label: "����"
      },
      regulation: {
        title: "���������",
        format: "������",
        entryFee: "������������� �����",
        discipline: "����������",
        terms: "������� �������",
        restrictions: "�����������",
        notes: "�������������� �������",
        empty: "������ ���������� ���� �� ��������."
      },
      regulationPresets: {
        entryIncluded: "�������� � ����� ������������",
        entryFree: "��� �������������� ������",
        term1: "� �������� ����� �������� ������ �������������� ������.",
        term2: "����� ������ ���� �� ����� �� ������� ������ �� ����������.",
        term3: "����������� ������������ ����� � ����� ������ ������.",
        restriction1: "��������� ����� �������� � ������������ ���������.",
        restriction2: "������������ ��������� ����� ����� �������� ���������������.",
        note1: "����� � ���������� ����������� �� ���� �������� �����������.",
        note2: "��� ������� �������� �������� ������� ������ �������."
      },
      resultLabels: {
        winner: "����������",
        finalist: "��������",
        semifinalist: "������������",
        participant: "��������"
      },
      participantStatuses: {
        active: "� �������",
        eliminated: "�����",
        winner: "����������",
        finalist: "��������",
        semifinalist: "������������"
      },
      management: {
        title: "���������� ������",
        subtitle: "����� ���������� �����������, ���������� ����� � ������������ ������.",
        back: "����� � ��������",
        openPublicPage: "������� ��������� �����",
        poolTitle: "��� ����������",
        poolHint: "���������� ������ �������� ������� ���������. ����� ��������� ����� ��� �����������.",
        playerPlaceholder: "�������� ������",
        seedPlaceholder: "����� ������",
        addParticipant: "�������� � �����",
        participantAdded: "�������� �������� � �����.",
        noAvailablePlayers: "��������� ������� ��� ���������� �� ��������.",
        bracketActions: "�������� �� �����",
        generate: "������������� �����",
        bracketGenerated: "����� ������� �������������.",
        alreadyGenerated: "����� ��� �������������.",
        minimumParticipants: "��� ��������� ����� ������� 2 ���������.",
        matchesTitle: "���������� �������",
        noMatches: "����� �������� ����� ��������� �����.",
        setStatus: "�������� ������",
        submitResult: "��������� ���������",
        winner: "����������",
        player1Score: "���� ������ 1",
        player2Score: "���� ������ 2",
        statusSaved: "������ ��������.",
        resultSaved: "��������� ��������.",
        champion: "�������",
        manage: "���������",
        myTournaments: "��� �������",
        emptyOwn: "� ��� ���� ��� �������� ��� ����������.",
        selectPlayer: "�������� ������ ��� ����������.",
        selectWinner: "�������� ���������� �����.",
        errors: {
          selectPlayer: "�������� ������ ��� ����������.",
          selectWinner: "�������� ���������� �����.",
          minimumParticipants: "������� 2 ��������� ��������� ��� ��������� �����.",
          byeResultLocked: "��� ������ � BYE ������ ���� ���������� ����������.",
          invalidWinner: "���������� ������ ���� ����� �� ���������� �����.",
          scoresRequired: "��� ����� ������ ���� �������� ������.",
          tieNotAllowed: "���� �� ����� ���� ������.",
          winnerScoreMismatch: "���������� ������ ��������������� �������� �����.",
          duplicateSeed: "Seed ������ ���� ���������� � ������ �������.",
          seedOutOfRange: "Seed ������ ���� � ��������� ������� �����."
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
