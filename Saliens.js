// JavaScript source code
(function () {
    if (typeof unsafeWindow !== "undefined")
        unsafeWindow.requestAnimationFrame = c => { setTimeout(c, 1000 / 60); };

    // ゲームを再読み込み
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
            // 未受領の高脅威ゾーンに移動
            var uncapturedPlanets = gGame.m_State.m_rgPlanets
                .filter(function (p) { return p.state && !p.state.captured })
                .sort(function (p1, p2) { return p2.state.difficulty - p1.state.difficulty });

            if (uncapturedPlanets.length == 0) {
                console.log("すべての惑星は征服されました。おめでとう！");
                return;
            }

            joinPlanet(uncapturedPlanets[0].id);
            return;
        }

        if (gGame.m_State.m_VictoryScreen || gGame.m_State.m_LevelUpScreen) {
            gGame.ChangeState(new CBattleSelectionState(gGame.m_State.m_PlanetData.id));
            console.log('ラウンドクリア');
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
            // 未受領のボスゾーンに移動 
            var bossZone = gGame.m_State.m_PlanetData.zones
                .find(function (z) { return !z.captured && z.boss });

            if (bossZone && bossZone.zone_position) {
                console.log('ゾーンでのボス戦:', bossZone.zone_position);
                joinZone(bossZone.zone_position);
                return;
            }

            // 未受領の高脅威ゾーンに移動
            var uncapturedZones = gGame.m_State.m_PlanetData.zones
                .filter(function (z) { return !z.captured })
                .sort(function (z1, z2) { return z2.difficulty - z1.difficulty });

            if (uncapturedZones.length == 0 && gGame.m_State.m_PlanetData) {
                console.log("この惑星は征服されました。");
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
        console.log('参加ゾーン:', zoneId);

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
        console.log('参加する惑星:', planetId);

        joiningPlanet = true;

        clearInterval(intervalFunc);

        gServer.JoinPlanet(
            planetId,
            function (response) {
                gGame.ChangeState(new CBattleSelectionState(planetId));
            },
            function (response) {
                ShowAlertDialog('惑星参加エラー', '惑星に参加できませんでした。 ゲームを再読み込みするか、時間をおいてもう一度試してください。');
            }
        );

        setTimeout(function () {
            intervalFunc = setInterval(gameCheck, 100);
        }, 10000);
    };

    var leavePlanet = function (planetDataId) {

        if (joiningPlanet) return;
        console.log('惑星から去る:', planetDataId);

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
        console.log('2秒後にロードします');

        clearInterval(intervalFunc);

        // ゲームがロードされるのを2秒待つ
        setTimeout(function () {
            gGame.m_State.button.click();

            setTimeout(function () {
                intervalFunc = setInterval(gameCheck, 100);
            }, 5000);
        }, 2000);
    };
})();