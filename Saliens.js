// JavaScript source code
(function () {
    if (typeof unsafeWindow !== "undefined")
        unsafeWindow.requestAnimationFrame = c => { setTimeout(c, 1000 / 60); };

    // �Q�[�����ēǂݍ���
    GameLoadError = function () {
        clearInterval(intervalFunc);
        setTimeout(function () {
            if (typeof unsafeWindow !== "undefined")
                unsafeWindow.location.reload();
            else
                window.location.reload();
        }, 750);
    }

    CEnemy.prototype.Walk = function () { this.Die(true); };
    var joiningZone = false;
    var joiningPlanet = false;
    var gameCheck = function () {

        if (!gGame || !gGame.m_State) return;

        if (gGame.m_State instanceof CBootState && gGame.m_State.button) {
            startGame();
            return;
        }

        if (gGame.m_State instanceof CPlanetSelectionState && gGame.m_State.m_rgPlanets) {
            // ����̂̍����Ѓ]�[���Ɉړ�
            var uncapturedPlanets = gGame.m_State.m_rgPlanets
                .filter(function (p) { return p.state && !p.state.captured })
                .sort(function (p1, p2) { return p2.state.difficulty - p1.state.difficulty });

            if (uncapturedPlanets.length == 0) {
                console.log("���ׂĂ̘f���͐�������܂����B���߂łƂ��I");
                return;
            }

            joinPlanet(uncapturedPlanets[0].id);
            return;
        }

        if (gGame.m_State.m_VictoryScreen || gGame.m_State.m_LevelUpScreen) {
            gGame.ChangeState(new CBattleSelectionState(gGame.m_State.m_PlanetData.id));
            console.log('���E���h�N���A');
            return;
        }

        if (gGame.m_State.m_ScoreIncrements && gGame.m_State.m_ScoreIncrements != 0 && gGame.m_State.m_rtBattleStart && gGame.m_State.m_rtBattleEnd) {
            var ptPerSec = (gGame.m_State.m_rtBattleEnd - gGame.m_State.m_rtBattleStart) / 1000;
            gGame.m_State.m_Score = gGame.m_State.m_ScoreIncrements * ptPerSec;
            gGame.m_State.m_ScoreIncrements = 0;
        }

        if (gGame.m_State.m_EnemyManager) {
            joiningZone = false;
            return;
        }

        if (gGame.m_State.m_PlanetData && gGame.m_State.m_PlanetData.zones) {
            joiningPlanet = false;
            // ����̂̃{�X�]�[���Ɉړ� 
            var bossZone = gGame.m_State.m_PlanetData.zones
                .find(function (z) { return !z.captured && z.boss });

            if (bossZone && bossZone.zone_position) {
                console.log('�]�[���ł̃{�X��:', bossZone.zone_position);
                joinZone(bossZone.zone_position);
                return;
            }

            // ����̂̍����Ѓ]�[���Ɉړ�
            var uncapturedZones = gGame.m_State.m_PlanetData.zones
                .filter(function (z) { return !z.captured })
                .sort(function (z1, z2) { return z2.difficulty - z1.difficulty });

            if (uncapturedZones.length == 0 && gGame.m_State.m_PlanetData) {
                console.log("���̘f���͐�������܂����B");
                leavePlanet(gGame.m_State.m_PlanetData.id);
                return;
            }

            joinZone(uncapturedZones[0].zone_position);
            return;
        }
    };

    var intervalFunc = setInterval(gameCheck, 100);

    var joinZone = function (zoneId) {
        if (joiningZone) return;
        console.log('�Q���]�[��:', zoneId);

        joiningZone = true;

        clearInterval(intervalFunc);

        gServer.JoinZone(
            zoneId,
            function (results) {
                gGame.ChangeState(new CBattleState(gGame.m_State.m_PlanetData, zoneId));
            },
            GameLoadError
        );

        setTimeout(function () {
            intervalFunc = setInterval(gameCheck, 100);
        }, 10000);
    };

    var joinPlanet = function (planetId) {
        if (joiningPlanet) return;
        console.log('�Q������f��:', planetId);

        joiningPlanet = true;

        clearInterval(intervalFunc);

        gServer.JoinPlanet(
            planetId,
            function (response) {
                gGame.ChangeState(new CBattleSelectionState(planetId));
            },
            function (response) {
                ShowAlertDialog('�f���Q���G���[', '�f���ɎQ���ł��܂���ł����B �Q�[�����ēǂݍ��݂��邩�A���Ԃ������Ă�����x�����Ă��������B');
            }
        );

        setTimeout(function () {
            intervalFunc = setInterval(gameCheck, 100);
        }, 10000);
    };

    var leavePlanet = function (planetDataId) {

        if (joiningPlanet) return;
        console.log('�f�����狎��:', planetDataId);

        joiningPlanet = true;

        clearInterval(intervalFunc);

        gServer.LeaveGameInstance(
            planetDataId,
            function () {
                gGame.ChangeState(new CPlanetSelectionState());
            }
        );

        setTimeout(function () {
            intervalFunc = setInterval(gameCheck, 100);
        }, 10000);
    };

    var startGame = function () {
        console.log('2�b��Ƀ��[�h���܂�');

        clearInterval(intervalFunc);

        // �Q�[�������[�h�����̂�2�b�҂�
        setTimeout(function () {
            gGame.m_State.button.click();

            setTimeout(function () {
                intervalFunc = setInterval(gameCheck, 100);
            }, 5000);
        }, 2000);
    };
})();