import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { DataSource } from 'typeorm'

// Этот сервис запускается один раз при старте приложения.
// Создаёт объекты БД (представления, функции, процедуры, триггеры)
// и заполняет таблицы тестовыми данными если они пустые.
@Injectable()
export class DatabaseInitService implements OnApplicationBootstrap {
  constructor(private dataSource: DataSource) {}

  async onApplicationBootstrap() {
    await this.createDatabaseObjects()
  }

  // ============================================================
  // Создание объектов БД
  // ============================================================
  private async createDatabaseObjects() {
    try {
      // Вспомогательная таблица для логирования изменений статуса коров
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS cow_audit_log (
          id SERIAL PRIMARY KEY,
          cow_id INTEGER,
          action VARCHAR(10) NOT NULL,
          old_status VARCHAR(50),
          new_status VARCHAR(50),
          changed_at TIMESTAMP DEFAULT NOW()
        )
      `)

      // ========== ПРЕДСТАВЛЕНИЯ (VIEWS) ==========

      // Представление 1: статистика по породам (количество, средний вес, средний надой)
      await this.dataSource.query(`
        CREATE OR REPLACE VIEW v_breed_stats AS
        WITH cow_base AS (
          SELECT breed,
                 COUNT(*)::INT                        AS total,
                 ROUND(AVG(weight)::NUMERIC, 2)       AS avg_weight
          FROM cows
          GROUP BY breed
        ),
        milk_base AS (
          SELECT c.breed,
                 ROUND(AVG(mr.liters)::NUMERIC, 2)    AS avg_milk
          FROM milk_records mr
          JOIN cows c ON c.id = mr.cow_id
          WHERE mr.recorded_at >= CURRENT_DATE - 30
          GROUP BY c.breed
        )
        SELECT
          cb.breed,
          cb.total,
          cb.avg_weight,
          COALESCE(mb.avg_milk, 0)                    AS avg_milk_per_day
        FROM cow_base cb
        LEFT JOIN milk_base mb ON mb.breed = cb.breed
      `)

      // Представление 2: сводка по фермам (количество коров по статусам)
      await this.dataSource.query(`
        CREATE OR REPLACE VIEW v_farm_summary AS
        SELECT
          f.id,
          f.name,
          f.location,
          COUNT(c.id)::INT                                              AS cow_count,
          COUNT(CASE WHEN c.status = 'healthy'  THEN 1 END)::INT       AS healthy_count,
          COUNT(CASE WHEN c.status = 'sick'     THEN 1 END)::INT       AS sick_count,
          COUNT(CASE WHEN c.status = 'pregnant' THEN 1 END)::INT       AS pregnant_count
        FROM farms f
        LEFT JOIN cows c ON c.farm_id = f.id
        GROUP BY f.id, f.name, f.location
        ORDER BY cow_count DESC
      `)

      // Представление 3: здоровые коровы с именем фермы
      await this.dataSource.query(`
        CREATE OR REPLACE VIEW v_healthy_cows AS
        SELECT
          c.id,
          c.name,
          c.breed,
          c.age,
          c.weight,
          f.name AS farm_name,
          f.location
        FROM cows c
        LEFT JOIN farms f ON c.farm_id = f.id
        WHERE c.status = 'healthy'
        ORDER BY c.name
      `)

      // ========== ФУНКЦИИ (FUNCTIONS) ==========

      // Функция 1: средний надой коровы за последние N дней
      await this.dataSource.query(`
        CREATE OR REPLACE FUNCTION get_cow_avg_milk(p_cow_id INT, p_days INT DEFAULT 30)
        RETURNS NUMERIC AS $$
        BEGIN
          RETURN COALESCE(
            (SELECT AVG(liters)
             FROM milk_records
             WHERE cow_id = p_cow_id
               AND recorded_at >= CURRENT_DATE - p_days),
            0
          );
        END;
        $$ LANGUAGE plpgsql
      `)

      // Функция 2: количество коров на ферме
      await this.dataSource.query(`
        CREATE OR REPLACE FUNCTION get_farm_cow_count(p_farm_id INT)
        RETURNS INT AS $$
        BEGIN
          RETURN (SELECT COUNT(*)::INT FROM cows WHERE farm_id = p_farm_id);
        END;
        $$ LANGUAGE plpgsql
      `)

      // Функция 3: суммарный надой всех коров за конкретную дату
      await this.dataSource.query(`
        CREATE OR REPLACE FUNCTION get_total_milk_by_date(p_date DATE DEFAULT CURRENT_DATE)
        RETURNS NUMERIC AS $$
        BEGIN
          RETURN COALESCE(
            (SELECT SUM(liters) FROM milk_records WHERE recorded_at = p_date),
            0
          );
        END;
        $$ LANGUAGE plpgsql
      `)

      // ========== ХРАНИМЫЕ ПРОЦЕДУРЫ (STORED PROCEDURES) ==========

      // Процедура 1: перевод коровы на другую ферму
      await this.dataSource.query(`
        CREATE OR REPLACE PROCEDURE transfer_cow(p_cow_id INT, p_new_farm_id INT)
        LANGUAGE plpgsql AS $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM cows WHERE id = p_cow_id) THEN
            RAISE EXCEPTION 'Корова с ID % не найдена', p_cow_id;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM farms WHERE id = p_new_farm_id) THEN
            RAISE EXCEPTION 'Ферма с ID % не найдена', p_new_farm_id;
          END IF;
          UPDATE cows SET farm_id = p_new_farm_id WHERE id = p_cow_id;
          RAISE NOTICE 'Корова % переведена на ферму %', p_cow_id, p_new_farm_id;
        END;
        $$
      `)

      // Процедура 2: добавить запись о надое через процедуру (с валидацией)
      await this.dataSource.query(`
        CREATE OR REPLACE PROCEDURE add_milk_record(
          p_cow_id INT, p_liters NUMERIC, p_user_id INT DEFAULT NULL
        )
        LANGUAGE plpgsql AS $$
        BEGIN
          IF p_liters <= 0 THEN
            RAISE EXCEPTION 'Надой должен быть больше 0 литров';
          END IF;
          IF NOT EXISTS (SELECT 1 FROM cows WHERE id = p_cow_id) THEN
            RAISE EXCEPTION 'Корова с ID % не найдена', p_cow_id;
          END IF;
          INSERT INTO milk_records(cow_id, liters, recorded_by, recorded_at)
          VALUES (p_cow_id, p_liters, p_user_id, CURRENT_DATE);
        END;
        $$
      `)

      // Процедура 3: пометить коров без записей надоя за 14 дней как sick
      await this.dataSource.query(`
        CREATE OR REPLACE PROCEDURE mark_cows_for_checkup()
        LANGUAGE plpgsql AS $$
        DECLARE
          updated_count INT;
        BEGIN
          UPDATE cows
          SET status = 'sick'
          WHERE status = 'healthy'
            AND breed IN ('Holstein', 'Jersey', 'Simmental')
            AND id NOT IN (
              SELECT DISTINCT cow_id FROM milk_records
              WHERE recorded_at >= CURRENT_DATE - INTERVAL '14 days'
            );
          GET DIAGNOSTICS updated_count = ROW_COUNT;
          RAISE NOTICE 'Помечено коров для осмотра: %', updated_count;
        END;
        $$
      `)

      // ========== ТРИГГЕРЫ (TRIGGERS) ==========

      // Триггер 1: логирование изменений статуса коровы в cow_audit_log
      await this.dataSource.query(`
        CREATE OR REPLACE FUNCTION trg_cow_status_audit_fn()
        RETURNS TRIGGER AS $$
        BEGIN
          IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO cow_audit_log(cow_id, action, old_status, new_status)
            VALUES (NEW.id, 'UPDATE', OLD.status, NEW.status);
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `)
      await this.dataSource.query(`DROP TRIGGER IF EXISTS trg_cow_status_audit ON cows`)
      await this.dataSource.query(`
        CREATE TRIGGER trg_cow_status_audit
        AFTER UPDATE ON cows
        FOR EACH ROW EXECUTE FUNCTION trg_cow_status_audit_fn()
      `)

      // Триггер 2: запрет записи надоя для коров в сухостое
      await this.dataSource.query(`
        CREATE OR REPLACE FUNCTION trg_milk_validate_fn()
        RETURNS TRIGGER AS $$
        DECLARE
          v_status VARCHAR;
        BEGIN
          SELECT status INTO v_status FROM cows WHERE id = NEW.cow_id;
          IF v_status = 'dry' THEN
            RAISE EXCEPTION
              'Нельзя добавить надой: корова (ID %) в сухостое', NEW.cow_id;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `)
      await this.dataSource.query(`DROP TRIGGER IF EXISTS trg_milk_validate ON milk_records`)
      await this.dataSource.query(`
        CREATE TRIGGER trg_milk_validate
        BEFORE INSERT ON milk_records
        FOR EACH ROW EXECUTE FUNCTION trg_milk_validate_fn()
      `)

      // Триггер 3: автоматическое обновление updated_at у пользователей
      await this.dataSource.query(`
        CREATE OR REPLACE FUNCTION trg_users_updated_at_fn()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `)
      await this.dataSource.query(`DROP TRIGGER IF EXISTS trg_users_updated_at ON users`)
      await this.dataSource.query(`
        CREATE TRIGGER trg_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION trg_users_updated_at_fn()
      `)

      console.log('Объекты базы данных успешно созданы')
    } catch (e) {
      console.error('Ошибка создания объектов БД:', e.message)
    }
  }

}
